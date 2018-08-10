const MongoClient = require('mongodb').MongoClient;
const {to} = require('../util/wutil');
const {uniqBy} = require('../util/wutil');

/*
	https://docs.mongodb.com/manual/tutorial/project-fields-from-query-results/
	https://mongodb.github.io/node-mongodb-native/markdown-docs/queries.html
	https://mongodb.github.io/node-mongodb-native/api-generated/collection.html#find	
	https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
*/

// Connection URL
const url = 'mongodb://192.168.0.101:27017';
const parser = { useNewUrlParser: true };
 
// Database Name
const DB_NAME = 'nh';
const COLLECTION_NAME = 'test';

const FILE_CHARSET_UTF8 = 'utf-8';

let fn = {};
module.exports = fn;

/*
* 질병 분류에서 질병명을 조회하여 해당 코드 정보를 반환한다
* @param find 조회하려는 병명
* @return 질병코드 목록
*/
fn.code = async function (find){

	let err, temp;
	// let show = {fields:{cod:1, cat1:1, cat2:1, cat3:1, eng:1, rem:1}};
	let queries = [
		[{ cat3 : new RegExp(find,"g") },3],
		[{ cat2 : new RegExp(find,"g") },2],
		[{ cat1 : new RegExp(find,"g") },1]
	];	// 조회시 랭크를 주기 위한 값을 설정, 점수가 높을수록 상위에 위치하도록 하기 위함

	let items = [];
	for(let query of queries){
		// [err,temp] = await to(fn.withQuery(query[0],show));
		[err,temp] = await to(fn.withQuery(query[0]));

		// 값 추가 
		temp.map(item=>item.search=query[1]);
		items = items.concat(temp);
	}

	// 중복 값 제거
	items = uniqBy(items, source=>source.cod);

	if(err){
		return Promise.reject(err);
	}

	// 필요 시 정렬(현재는 랭크순서대로 넣으므로 정렬할 필요는 없을듯 싶음)
	return Promise.resolve(items);
}

/*
* @param query 질의 기준으로 결과를 조회한다
* @param show 보여줄 필드를 정의한다 (optional)
* @return 결과 목록
*/
fn.withQuery = async function (query, show){

	let err;

	let client;
	[err,client] = await to(MongoClient.connect(url,parser));

	let result;
	if(!err){
		const db = client.db(DB_NAME);
		const collection = db.collection(COLLECTION_NAME);
		if(show){
			[err,result] = await to(collection.find(query, show).toArray());
		}else{
			[err,result] = await to(collection.find(query).toArray());
		}
		
	}

	// 종료처리
	if(client){
		client.close();	
	}

	// 오류 발생 
	if(err){
		return Promise.reject(err);
	}

	// 정상 처리
	return Promise.resolve(result);
}



/*
* collection 에 존재하는 모든 값을 출력
*/
fn.all = async function (){

	let err;

	let client;
	[err,client] = await to(MongoClient.connect(url,parser));

	let result;
	if(!err){
		const db = client.db(DB_NAME);
		const collection = db.collection(COLLECTION_NAME);
		[err,result] = await to(collection.find({}).toArray());
	}

	// 종료처리
	if(client){
		client.close();	
	}

	// 오류 발생 
	if(err){
		return Promise.reject(err);
	}

	// 정상 처리
	return Promise.resolve(result);
}
