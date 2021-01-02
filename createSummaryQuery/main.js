//設定


var START_DATE = "2020-11-01"
var END_DATE  = "2021-01-03" //最終日含む条件で検索するので、最終日+1を指定する。

/**
* Ajax通信用のメソッド
* @param method : GET, POST
* @param url : リクエスト先のURL
* @param request : requestのjson
* @param successFunc : リクエスト成功時に起動するfunction
* @returns
*/
function sendAjaxRequest2(method, url, request, successFunc, param){

    //ajaxでservletにリクエストを送信
    $.ajax({
       type    : method,   //GET / POST
       url     : url,      //送信先のServlet URL（適当に変えて下さい）
       data    : request,  //リクエストJSON
       async   : true      //true:非同期(デフォルト), false:同期
    })
    // 通信成功時
    .done( function(data) {
      console.log(url);
      successFunc(data, param)
    })
    // 通信失敗時
		 .fail( function(data) {
        alert("リクエスト時になんらかのエラーが発生しました：");
		 });
}


/***********************************************************
* 情報取得処理
*************************************************************/

var eventList = {}
var eventListByDate = {}
var compFlg = false
var issuePage = 1
var allCount = 0
var dateList = {}


function getIssueDeatil(){

  var method = "GET";
  var successFunc = writeIssueDeatil;
  var url = GIT_URL +  "/groups/" + GROUP_ID + "/issues";
  var request = "private_token=" + TOKEN + "&per_page=100" +  "&page=" + issuePage;
  sendAjaxRequest2(method, url, request, successFunc)

}

function writeIssueDeatil(data){

	//console.log(data);
	for(var i in data){
    allCount++;
		var d = data[i]
		var nextFlg = false;
		var array = {}
		array["opened"] = d.created_at.slice(0,10)

    //ステータスがtodo～closedの場合、labelの遷移を確認する
		if(d.closed_at){
			array["closed"] = d.closed_at.slice(0,10)
			nextFlg = true
		} else {
			if(d.labels.indexOf("To Do")!= -1 || d.labels.indexOf("Doing")!= -1 || d.labels.indexOf("Done")!= -1){
				nextFlg = true
			}
		}
		eventList[d.id] = array

    //ラベルの確認が必要な場合
		if(nextFlg){
			getLabelEvents(d)
		}
	}

  //100件以上の場合、再度実施
  if(data.length == 100){
      issuePage++;
      console.log("data.length: " + data.length + ", issuePage: " + issuePage)
      getIssueDeatil()
  } else if(!compFlg){
    compFlg = true
  }
}




function getLabelEvents(param){

  var method = "GET";
  var successFunc = writeLabel;
  var url = GIT_URL + "/projects/" + param.project_id + "/issues/" + param.iid + "/resource_label_events";
  var request = "private_token=" + TOKEN + "&per_page=100";
  sendAjaxRequest2(method, url, request, successFunc, param)

}


function writeLabel(data,param){

	//console.log(param_id)


	//sysout(data);
	//var array = {}

	for(var i in data){
		var d = data[i];
		//console.log(eventList[param.id])
		if(d.action == "add" && (d.label.name == "To Do" || d.label.name == "Doing" || d.label.name == "Done")){
			eventList[param.id][d.label.name] = d.created_at.slice(0,10)
		}
	}
	//console.log(eventList)

}


var openCount = 0
var todoCount = 0
var doingCount = 0
var doneCount = 0

var openDoingCount = 0
var openDoneCount = 0
var openClosedCount = 0
var todoDoneCount = 0
var todoClosedCount = 0
var doingCloseCount = 0


function method(){

	for(var i in eventList){

		var d = eventList[i];

		console.log(d)

		var opened = d["opened"]
		var todo = ""
		var doing = ""
		var done = ""
		var closed = ""

		if(d["To Do"]){
			todo = d["To Do"]
		}
		if(d["Doing"]){
			doing = d["Doing"]
		}
		if(d["Done"]){
			done = d["Done"]
		}
		if(d["closed"]){
			closed = d["closed"]
		}

		//判定
		if(opened != "" && opened == todo){
			opened = ""
			openCount++
		}
		if(todo != "" && todo == doing){
			todo = ""
			todoCount++
		}
		if(doing != "" && doing == done){
			doing = ""
			doingCount++
		}
		if(done != "" && done == closed){
			done = ""
			doneCount++
		}

		//判定飛び越し

		if(opened != "" && opened == doing){
			opened = ""
			openDoingCount++
		}
		if(opened != "" && opened == done){
			opened = ""
			openDoneCount++
		}
		if(opened != "" && opened == closed){
			opened = ""
			openClosedCount++
		}

		if(todo != "" && todo == done){
			todo = ""
			todoDoneCount++
		}
		if(todo != "" && todo == closed){
			todo = ""
			todoClosedCount++
		}

		if(doing != "" && doing == closed){
			doing = ""
			doingCloseCount++
		}



		if(opened != ""){
			if(!eventListByDate[opened]){
				eventListByDate[opened] = {}
			}
			if(!eventListByDate[opened].opened){
				eventListByDate[opened].opened = 0
			}
			eventListByDate[opened].opened ++
		}
		if(todo != ""){
			if(!eventListByDate[todo]){
				eventListByDate[todo] = {}
			}
			if(!eventListByDate[todo].todo){
				eventListByDate[todo].todo = 0
			}
			eventListByDate[todo].todo ++
		}
		if(doing != ""){
			if(!eventListByDate[doing]){
				eventListByDate[doing] = {}
			}
			if(!eventListByDate[doing].doing){
				eventListByDate[doing].doing = 0
			}
			eventListByDate[doing].doing ++
		}
		if(done != ""){
			if(!eventListByDate[done]){
				eventListByDate[done] = {}
			}
			if(!eventListByDate[done].done){
				eventListByDate[done].done = 0
			}
			eventListByDate[done].done ++
		}
		if(closed != ""){
			if(!eventListByDate[closed]){
				eventListByDate[closed] = {}
			}
			if(!eventListByDate[closed].closed){
				eventListByDate[closed].closed = 0
			}
			eventListByDate[closed].closed ++
		}
	}
	console.log("openCount:" + openCount)
	console.log("todoCount:" + todoCount)
	console.log("doingCount:" + doingCount)
	console.log("doneCount:" + doneCount)


	console.log("openDoingCount:" + openDoingCount)
	console.log("openDoneCount:" + openDoneCount)
	console.log("openClosedCount:" + openClosedCount)
	console.log("todoDoneCount:" + todoDoneCount)
	console.log("todoClosedCount:" + todoClosedCount)
	console.log("doingCloseCount:" + doingCloseCount)

	console.log(eventListByDate)
}




function dateListSet(){

  //例)2020-12-1 - 2021-1-1まで
  // var date = new Date(2020, 11, 1)
  // var KIKAN = 32;

  var startDateStrArr = START_DATE.split("-")
  var date = new Date(startDateStrArr[0], parseInt(startDateStrArr[1])-1, startDateStrArr[2])
  var KIKAN = dateDiff(START_DATE, END_DATE);

  for(var i = 0 ; i< KIKAN ; i++){
		var str = date.getFullYear() + "-" + ("00" + (date.getMonth() + 1)).slice(-2) + "-" + ("00" + date.getDate()).slice(-2)
		dateList[str] = {}
		dateList[str][1] = 0
		dateList[str][2] = 0
		dateList[str][3] = 0
		dateList[str][4] = 0
		dateList[str][5] = 0
    date.setDate(date.getDate() + 1)
	}
}


/*
0:なし
1:opened
2:todo
3:doing
4:done
5:closed
*/

function dataJudge(array, date){

	var retArray = {}
	var ret = 0
	var endDate = ""

	// if(array['opened']){
	// 	// console.log(array, date)
  //
	// }


	if(array['opened'] && array['opened'] == date){
		ret = 1
		endDate = ""

		if(array['To Do']){
			endDate = array['To Do']
		} else if(array['Doing']){
			endDate = array['Doing']
		} else if(array['Done']){
			endDate = array['Done']
		} else if(array['closed']){
			endDate = array['closed']
		}


    // console.log(ret, array, date, endDate)
	}
	if(array['To Do'] && array['To Do'] == date){
		ret = 2
		endDate = ""
		if(array['Doing']){
			endDate = array['Doing']
		} else if(array['Done']){
			endDate = array['Done']
		} else if(array['closed']){
			endDate = array['closed']
		}
    // console.log(ret, array, date, endDate)

  }

	if(array['Doing'] && array['Doing'] == date){
		ret = 3
		endDate = ""
		if(array['Done']){
			endDate = array['Done']
		} else if(array['closed']){
			endDate = array['closed']
		}
    // console.log(ret, array, date, endDate)

	}

	if(array['Done'] && array['Done'] == date){
		ret = 4
		endDate = ""
		if(array['closed']){
			endDate = array['closed']
		}
        // console.log(ret, array, date, endDate)
  }

	if(array['closed'] && array['closed'] == date){
		ret = 5
		endDate = ""
        // console.log(ret, array, date, endDate)
	}

	retArray.ret = ret
	retArray.endDate = endDate

	return retArray;
}



function calc(){

  // console.log(eventList)

	// START_DATEより前であれば、初期日を設定
	for(var j in eventList){
		for(var i in eventList[j]){
			var dd = dateDiff(START_DATE, eventList[j][i])
			if(dd < 0){
        // console.log(dd, eventList[j][i], START_DATE)

				eventList[j][i] =  START_DATE
			}
		}

	}

	// START_DATE以降であれば
	for(var i in dateList){
		for(var j in eventList){
			var ret = dataJudge(eventList[j], i)
			if(ret.ret != 0){
        console.log(ret)

				if(ret.endDate == ""){
					ret.endDate = END_DATE
				}
				var dd = dateDiff(i, ret.endDate )
        // console.log(dd, ret.ret, ret.endDate, i)


        var d_split = i.split("-")
        var date3 = new Date(d_split[0], d_split[1]-1 , d_split[2])

        for(var k=0; k< dd; k++){
          var dateStr = date3.getFullYear() + "-" +  ("00" + (date3.getMonth() + 1)).slice(-2) + "-" + ("00" + date3.getDate()).slice(-2)
          // console.log(dd, ret.ret, ret.endDate, dateStr)
          dateList[dateStr][ret.ret]++
          date3.setDate(date3.getDate() + 1)
        }
			}
		}
	}
}


function dateDiff(dateStr1, dateStr2){

	var dateStr1Arr = dateStr1.split("-")
	var dateStr2Arr = dateStr2.split("-")

	var d1 = new Date(dateStr1Arr[0], dateStr1Arr[1]-1,dateStr1Arr[2])
	var d2 = new Date(dateStr2Arr[0], dateStr2Arr[1]-1,dateStr2Arr[2])
	return ((d2 - d1) / 86400000);

}


function createSummaryQuery(){

	for(var i in dateList){
	  var d = dateList[i]
	  console.log("INSERT INTO summary(`date`, opened, todo, doing, done, closed) VALUES ('" + i + "', " + d[1] + ", " + d[2] + ", " + d[3] + ", " + d[4] + ", " + d[5] + ");")
	}
}


console.log("read completed2")
