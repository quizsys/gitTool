/***********************************************************
* 共通処理
*************************************************************/

/**
* Ajax通信用のメソッド
* @param method : GET, POST
* @param url : リクエスト先のURL
* @param request : requestのjson
* @param successFunc : リクエスト成功時に起動するfunction
* @returns
*/
function sendAjaxRequest(method, url, request, successFunc, failFunc){

    //ajaxでservletにリクエストを送信
    $.ajax({
       type    : method,   //GET / POST
       url     : GIT_URL + url,      //送信先のServlet URL（適当に変えて下さい）
       data    : request,  //リクエストJSON
       async   : true      //true:非同期(デフォルト), false:同期
    })
    // 通信成功時
    .done( function(data) {
      console.log(url);
      successFunc(data)
    })
    // 通信失敗時
		 .fail( function(data) {
      if(failFunc != undefined){
        failFunc(data)
      } else {
        alert("リクエスト時になんらかのエラーが発生しました：");
      }
		 });
}

/**
* APIへのAjax通信用のメソッド
* @param method : GET, POST
* @param url : リクエスト先のURL
* @param request : requestのjson
* @param successFunc : リクエスト成功時に起動するfunction
* @returns
*/
function sendAjaxRequestToApi(method, url, request, successFunc){

    //ajaxでservletにリクエストを送信
    $.ajax({
       type    : method,   //GET / POST
       url     : API_URL + url,      //送信先のServlet URL（適当に変えて下さい）
       data    : request,  //リクエストJSON
       async   : true      //true:非同期(デフォルト), false:同期
    })
    // 通信成功時
    .done( function(data) {
      console.log(url);
      successFunc(data)
    })
    // 通信失敗時
		 .fail( function(data) {
        alert("リクエスト時になんらかのエラーが発生しました：");
		 });
}


/**
* 標準出力する
*/
function sysout(data){
  console.log(data)
}

/**
* 現在時刻をMM/dd hh:mm:ssで表示する
*/
function getNow(){

  var now = new Date();
  var month = now.getMonth() + 1
  var date = now.getDate()
  var hours = now.getHours()
  var minutes = now.getMinutes()
  var seconds = now.getSeconds()

  var str = month + "/" + date + " " + hours + ":" + minutes + ":" + seconds
  return  str;
}


/**
* 四捨五入する関数
* @number: 元の数字
* @n: 小数点第n位まで残す
*/
function round(number, n){
  return Math.floor( number * Math.pow( 10, n ) ) / Math.pow( 10, n ) ;
}

/**
* 四捨五入（繰り上げ）する関数
* @number: 元の数字
* @n: 小数点第n位まで残す
*/
function ceil(number, n){
  return Math.ceil( number * Math.pow( 10, n ) ) / Math.pow( 10, n ) ;
}



/**
* オブジェクトの配列から、キーが指定した値をオブジェクトを返却する
*/
function searchElementSrtFromArray(array, key, searchStr){

  var ret = null;
  for(var i in array){
      if(array[i][key] == searchStr){
        ret = array[i];
        break;
      }
  }
  return ret;
}


/**
* 日付の差分を計算
* 例) 2020-01-01 と 2020-01-05 の差分 => 4
*/
function dateDiff(dateStr1, dateStr2){

	var dateStr1Arr = dateStr1.split("-")
	var dateStr2Arr = dateStr2.split("-")

	var d1 = new Date(dateStr1Arr[0], dateStr1Arr[1]-1,dateStr1Arr[2])
	var d2 = new Date(dateStr2Arr[0], dateStr2Arr[1]-1,dateStr2Arr[2])
	return ((d2 - d1) / 86400000);

}

/**
* 現在日時から「minasDate」を引いた日時をyyyy-MM-ddで表示する
*/
function getDateStr(minasDate){

  var now = new Date();
  now.setDate(now.getDate()- minasDate)
  var year = now.getFullYear()
  var month = now.getMonth() + 1
  var date = now.getDate()
  return str = year + "-" + ("00" + month).slice(-2) + "-" + ("00" + date).slice(-2);

}

/**
* 日付文字列をDate型で返す
*/
function strToDate(dateStr){
  var dateStrArr = dateStr.split("-")
  return new Date(dateStrArr[0], dateStrArr[1]-1,dateStrArr[2])

}


/**
* Date型オブジェクトを日付文字列（yyyy-MM-dd）で返す
*/
function dateToStr(date){
  return date.getFullYear() + "-" + ("00" + (date.getMonth() + 1)).slice(-2) + "-" + ("00" + date.getDate()).slice(-2)
}


console.log("read completed common")
