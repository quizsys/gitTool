//設定

var MILESTONE = "sprint0005"

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

var issuePage = 1
var allCount = 0
var dateList = {}
var issueList = {}
var milestoneList
var labelIssueList = {}


function getIssueDeatil(){


  var method = "GET";
  var successFunc = writeIssueDeatil;
  var url = GIT_URL +  "/groups/" + GROUP_ID + "/issues";
  var request = "private_token=" + TOKEN + "&per_page=100" +  "&page=" + issuePage + "&milestone=" + MILESTONE
  sendAjaxRequest2(method, url, request, successFunc)

}

function writeIssueDeatil(data){

	//console.log(data);
	for(var i in data){
    allCount++;
		var d = data[i]
    d.compFlg = false;
    d.compDate = "";

    //ステータスがtodo～closedの場合、labelの遷移を確認する
		if(d.closed_at){
			d.compDate = d.closed_at.slice(0,10)
			d.compFlg = true
		} else {
			if(d.labels.indexOf("Done")!= -1){
				d.compFlg = true
			}
		}
		issueList[d.id] = d

    //ラベルの確認が必要な場合
		if(d.compFlg){
			getLabelEvents(d)
		}
	}

  //100件以上の場合、再度実施
  if(data.length == 100){
      issuePage++;
      console.log("data.length: " + data.length + ", issuePage: " + issuePage)
      getIssueDeatil()
  }
}




function getLabelEvents(param){

  var method = "GET";
  var successFunc = writeLabel;
  var url = GIT_URL + "/projects/" + param.project_id + "/issues/" + param.iid + "/resource_label_events";
  var request = "private_token=" + TOKEN + "&per_page=100";
  sendAjaxRequest2(method, url, request, successFunc, param)

}


// labelから完了日を計算
function writeLabel(data,param){

	for(var i in data){
		var d = data[i];
		if(d.action == "add" && d.label.name == "Done"){
      issueList[param.id].compDate = d.created_at.slice(0,10)
		}
	}
}


/**
* マイルストーンの一覧を取得
*/
function getMilestoneList(){

    var method = "GET";
    var successFunc = writeMilestoneList;
    var url =  "/groups/" + GROUP_ID + "/milestones";
    var request = "private_token=" + TOKEN + "&per_page=100";
    sendAjaxRequest(method, url, request, successFunc)

}

/**
* マイルストーンの一覧を設定
*/
function writeMilestoneList(data){
  milestoneList = data;
  // dateListSet();

  // ついでにhtmlに出力
  var html = "";
  for(var i in data){
    html += "<option value='" + data[i].title +"'>" + data[i].title + "</option>";
  }
  document.getElementById("milestone").innerHTML = html;


}

//日付のリストを作成
function dateListSet(){

  MILESTONE = document.getElementById("milestone").value

  // var milestone = milestoneList[MILESTONE]
  var milestone =  searchElementSrtFromArray(milestoneList, "title", MILESTONE)


  //初期化
  dateList = []
  var startDateStr = milestone.start_date
  var dueDateStr = milestone.due_date
  var dateRange = dateDiff(startDateStr, dueDateStr) + 1　//初日を含むため+1する
  var startDate = strToDate(startDateStr)

  var tmpDate = startDate;
  for(var i = 0; i< dateRange; i++){

    var str = dateToStr(tmpDate)
    dateList.push(str)
    tmpDate.setDate(tmpDate.getDate() + 1)

  }

  console.log(dateList)
  console.log("[END]日付セット")

  getIssueDeatil()

}



//ISSUE、MRの時間を集計
function summaryTime(data, baseDate){

  var labelArray = {};
  var array = {};
  var ret = {};

  var allLabel = {
    issue_count: 0,
    comp_issue_count: 0,
    name: "すべて",
    time_estimate: 0,
    total_time_spent: 0,
    comp_time_estimate: 0
  }

  for(var i in data){


    //完了フラグ
    var compFlg = false;

    // console.log("compDate: " + data[i].compDate + ", baseDate: " + baseDate + "diff: " + dateDiff(data[i].compDate, baseDate))

    if(data[i].compFlg && dateDiff(data[i].compDate, baseDate) >= 0){
      compFlg = true;
    }

    //タグ別一覧の配列を作成
    var labels = data[i].labels

    for(var j in labels){


      if(!labelArray[labels[j]]) {
        labelArray[labels[j]] = {}
        labelArray[labels[j]].issue_count = 0
        labelArray[labels[j]].comp_issue_count = 0
        labelArray[labels[j]].time_estimate = 0
        labelArray[labels[j]].total_time_spent = 0
        labelArray[labels[j]].comp_time_estimate = 0
      }
      labelArray[labels[j]].issue_count ++
      labelArray[labels[j]].time_estimate += data[i].time_stats.time_estimate
      labelArray[labels[j]].total_time_spent += data[i].time_stats.total_time_spent
      if(compFlg){
        labelArray[labels[j]].comp_issue_count ++
        labelArray[labels[j]].comp_time_estimate += data[i].time_stats.time_estimate
      }
    }

    //allLabelの集計
    allLabel.issue_count ++
    allLabel.time_estimate += data[i].time_stats.time_estimate
    allLabel.total_time_spent += data[i].time_stats.total_time_spent
    if(compFlg){
      allLabel.comp_issue_count ++
      allLabel.comp_time_estimate += data[i].time_stats.time_estimate
    }

  }
  labelArray["すべて"] = allLabel;
  return labelArray
}




function calc(){

  labelIssueList = {}

  //日付分繰り返し
  for(var i in dateList){
    var baseDate = dateList[i]
    labelIssueList[baseDate] = summaryTime(issueList, baseDate)
  }

  //クエリを出力
  createQuery()
}


function createQuery(){

  var retArray = []

	for(var i in labelIssueList){
	  var dateList = labelIssueList[i]
    var date = i
    for(var j in dateList){
      var d = dateList[j]
      var label = j
      var str = "INSERT INTO gitlabdb.burndown( milestone, label, `date`, all_issue_count, comp_issue_count, time_estimate, total_time_spent, total_time_spent_merge_request, comp_time_estimate) "
       + "VALUES ("
       + "'" + MILESTONE + "', "
       + "'" + label + "', "
       + "'" + date + "', "
       + d.issue_count + ", "
       + d.comp_issue_count + ", "
       + d.time_estimate + ", "
       + d.total_time_spent + ", "
       + 0 + ", "
       + d.comp_time_estimate
       + ");"
       retArray.push(str)
       console.log(str)
    }
	}

  var text = ""
  for(var i in retArray){
    text += retArray[i] + "\n"
  }
  document.getElementById("result-space").value = text

}


console.log("read completed2")
