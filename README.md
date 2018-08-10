# cbkakao

kakao talk mvp.

## 관련 링크

* [카카오 플러스친구 API 연동 with Node.js](http://yuddomack.tistory.com/10)
* [카카오 플러스친구 로그인](https://center-pf.kakao.com/login)


안녕하세요. 말씀하신 스펙은 현재 제휴사를 대상으로 클로즈베타 서비스 중인
카카오 I 오픈빌더(http://bot-builder.kakao.com/) 에서만 제공하는 기능입니다.

AI 사업 제휴를 원하시면 해당 사이트에서 제휴제안을 등록해주시거나
카카오 공식 챗봇 에이전시를 통해 이용해주시면 됩니다. (https://pf.kakao.com/_TsIAE/9233366)
카카오 I 오픈빌더는 추후 정식 오픈될 예정입니다. (시기 미정)


curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"user_key":"HH213ZpyUWYh","type": "text","content": "차량번호등록"}' \
  http://jwsnt.co.kr:3000/message