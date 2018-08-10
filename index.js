const express = require('express');
const bodyParser = require('body-parser');
const search = require('./cmd/search');
const app = express();

const {to} = require('./util/wutil');
const {isNotEmpty} = require('./util/wutil');
const {getBLen} = require('./util/wutil');


// parse application/json
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

const DEFAULT_TIME_GAP = 1000 * 60 * 5; // 5 min

const DEFAULT_TEXT = {
  type : "text"
};
const DEFAULT_MENUS = {
  type : "buttons",
  buttons : ["질병별 인수기준"]
};

const DEFAULT_MENUS_SHOW = {
	message : {
		text:'메뉴보기'
	},
	keyboard: DEFAULT_MENUS
};
const DEFAULT_MENUS_TIMEOUT = {
	message : {
		text:'응답시간이 초과 되었습니다.\n처음부터 다시 시작 바랍니다.'
	},
	keyboard: DEFAULT_MENUS
};
const DEFAULT_MSG_ERR = {
	message : {
		text:'알 수 없는 오류가 발생했습니다.\n처음부터 다시 시작 바랍니다.'
	},
	keyboard: DEFAULT_MENUS
};
const DEFAULT_MSG_START = {
	message:{
		text : '확인하고자 하는 질병명을 입력 바랍니다.'	
	}
};

app.get('/keyboard',function(req,res){
  let answer = DEFAULT_MENUS;
  res.send(answer);
});

let users = []; // {user_key:'user_key', last_time:new Date().getTime()}

app.post('/message', async function(req,res){
  
	const data = {
		user_key: req.body.user_key,
		type: req.body.type,
		content: req.body.content
	};

	console.log(data);

	// 시작
	if(DEFAULT_MENUS.buttons[0]==data.content){

		// 기존 동일 유저 정보 제거 & 시간 차이 5분 이상 대상자 제거
		users = users.filter(x=>x.user_key!=data.user_key&&x.update>new Date().getTime()-DEFAULT_TIME_GAP );
		users.push({
			user_key:data.user_key,
			create:new Date().getTime(),
			update:new Date().getTime(),
			step:1
		});	
	}

	let curr = users.filter(x=>x.user_key==data.user_key);
	if(curr.length!=1){
		// 응답시간 초과
		res.send(DEFAULT_MENUS_TIMEOUT);
	}else{
		// 실제 질병별 인수기준 처리
		curr = curr[0];

		switch(curr.step){
			case 1: // 1. 시작
				handleStep1(data, curr, res);
			break;

			case 2: // 2. 질병 검색
				handleStep2(data, curr, res);
			break;
			
			case 3: // 3. 상위 분류 선택
				handleStep3(data, curr, res);
			break;

			case 4: // 4. 하위 분류 선택
				handleStep4(data, curr, res);
			break;

			default:
				res.send(DEFAULT_MSG_ERR);
				break;
		}
	}

});

app.listen(3000,function(){
  console.log(`Connect 3000 port!`)
});

async function handleStep1(data, curr, res){
	updateStep(curr, 2);
	res.send(DEFAULT_MSG_START);
}

async function handleStep2(data, curr, res){
	let codes;
	[err, codes] = await to(search.code(data.content));

	if(!err){
		let buttons = [];
		let text = [];
		// accepts 가 존재하는 항목만 출현 시켜주도록 한다
		codes = codes.filter(code=>code.accepts&&code.accepts.length>0);	
		if(codes.length==0){						
			text.push(`( ${data.content} ) 로 검색한 결과가 존재하지 않습니다.\n\n확인하고자 하는 질병명을 재입력 바랍니다.`);
			updateStep(curr, 2);
		}else{
			text.push(`검색된 결과가 아래와 같습니다.\n`);
			for(let item of codes){
				buttons.push(item.cod);
				text.push(`병명코드 : [ ${item.cod} ], 분류 ( ${getBreadcombs([item.cat1, item.cat2, item.cat3])} )`);
			}
			text.push(`\n위 질병 중 확인하고자 하는 병명코드를 선택 바랍니다.`);
			updateStep(curr, 3, codes);
		}
		res.send( makeMessage( text.join('\n'), buttons ) );
	}else{
		res.send( makeErrMessage(err) );
	}
}

async function handleStep3(data, curr, res){
	let codes = curr.data;
	let code = codes.filter(res=>res.cod==data.content);
	let buttons = [];
	let text = [];
	code = code[0]; // 선택형 이므로 반드시 일치함

	text.push(`_________________________`);
	text.push(`코드 : ${code.cod}`);
	text.push(`분류 : ( ${getBreadcombs([code.cat1, code.cat2, code.cat3])} )`);
	if(code.eng){
		text.push(`영문명 : ${code.eng}`);
	}
	if(code.rem){
		text.push(`비고 : ${code.rem}`);	
	}
	if(code.infos && code.infos.length>0){
		for(let info of code.infos){
			text.push(`${info.tit} : ${info.des}`);
		}
	}
	if(code.descs && code.descs.length>0){
		for(let desc of code.descs){
			text.push(`* ${desc.des}`);
		}
	}
	
	text.push(`_________________________`);
	if(code.accepts && code.accepts.length>0){
		for(let accept of code.accepts){
			buttons.push(accept.seco);
			text.push(`상태코드 : [ ${accept.seco} ], 분류 ( ${getBreadcombs([accept.cat1, accept.cat2, accept.cat3, accept.cat4])})`);
		}
	}

	text.push(`_________________________`);
	updateStep(curr, 4, code);
	res.send( makeMessage( text.join('\n'), buttons ) );
}

async function handleStep4(data, curr, res){
	let code = curr.data;
	let matchAccept = code.accepts.filter(accept=>accept.seco==data.content);
	matchAccept = matchAccept[0];
	let text = [];
	let buttons = DEFAULT_MENUS.buttons;

	const dic = {
		ded:'일반사망',wud:'재해(상해)',whai:'재해입원/상해실손',ccr:'암',spdi:'특정질병',
		hoop:'질병입원수술',ltc:'장기간병',dipr:'질병실손',wuho:'재해(입원)',mepr:'의료실손',
		dihp:'질병입원실손',divp:'질병통원실손'
	};

	let items = Object.entries(matchAccept.insu).filter(item=>item[1].trim()!='');	// 값이 없는 것 제외
	for(let item of items){
		let key = dic[item[0]];
		let val = item[1];
		text.push(`${key} : ${val.padStart(20 - getBLen(key))}` );
	}

	updateStep(curr, 1);
	res.send( makeMessage( text.join('\n'), buttons ) );	
}

function makeErrMessage(err){
	return {message : {text: err.toString()}}
}

function makeMessage(msg, buttons=[]){

	if(buttons.length>0){
		return {message : {text: msg}, keyboard: {type : "buttons",buttons : buttons}}
	}else{
		return {message : {text: msg}}	
	}
}

/*
* 입력받은 값이 존재할 경우 연결한다
* @param items 대상목록 정보(연결할 순서대로 넣어준다)
* @param linkChar 이어줄 단어
* @return 분류구분
*/
function getBreadcombs(items, linkChar=' - '){

	let out = [];

	for(let it of items){
		if(isNotEmpty(it)){
			out.push(it);
		}
	}
	
	return out.join(linkChar);
}

function updateStep(curr, step, data){
	let now = users.filter(x=>x.user_key==curr.user_key)[0];	// 만약 대상이 없으면 말도 안되는 애러임...
	now.update = new Date().getTime();
	now.step = step;
	if(data){
		now.data = data;
	}
}