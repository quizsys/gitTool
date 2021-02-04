const RELEASE_VERSION = "v4"   // このスクリプトのバージョン
var labelIssueList                       // label別issueの一覧配列
var compFlg = false            // issueとMRの集計完了フラグ
var issueList = []             // issueの一覧
var mrList = []      // MRの一一覧
var issuePage = 1              // issueのページ番号（100件以上になると1増やす）
var mergeRequestPage = 1       // MRのページ番号（100件以上になると1増やす）
var projectList = {}
var labelChart
var milestoneList
var selectMilestone

// /**
// * Ajax通信用のメソッド
// * @param method : GET, POST
// * @param url : リクエスト先のURL
// * @param request : requestのjson
// * @param successFunc : リクエスト成功時に起動するfunction
// * @returns
// */
// function sendAjaxRequest(method, url, request, successFunc, failFunc){
//
//     //ajaxでservletにリクエストを送信
//     $.ajax({
//        type    : method,   //GET / POST
//        url     : GIT_URL + url,      //送信先のServlet URL（適当に変えて下さい）
//        data    : request,  //リクエストJSON
//        async   : true      //true:非同期(デフォルト), false:同期
//     })
//     // 通信成功時
//     .done( function(data) {
//       console.log(url);
//       successFunc(data)
//     })
//     // 通信失敗時
// 		 .fail( function(data) {
//       if(failFunc != undefined){
//         failFunc(data)
//       } else {
//         alert("リクエスト時になんらかのエラーが発生しました：");
//       }
// 		 });
// }


/***********************************************************
* 情報取得処理
*************************************************************/

/**
* ISSUEとMRの情報を取得する
**/
function getInfo(){

    // ボタンを非活性にする
    document.getElementById("get-info-btn").disabled = true;

    //初期化
    compFlg = false
    issueList = []
    mrList = []
    issuePage = 1
    mergeRequestPage = 1
    selectMilestone = document.getElementById("milestone").value;

    //実行
    getIssues()
    getMergeRequests()
}


/**
* ISSUEを取得する
*/
function getIssues(){

  var milestone = selectMilestone;
  var method = "GET";
  var successFunc = issuesResult;
  var url = "/groups/" + GROUP_ID + "/issues";
  var request = "private_token=" + TOKEN + "&per_page=100&milestone=" + milestone + "&page=" + issuePage;
  sendAjaxRequest(method, url, request, successFunc)

}

/*
* 全issueを集計できたか判定。→まだの場合、再度取得処理を実施。
*/
function issuesResult(data){

  issueList = issueList.concat(data)
  console.log("ISSUE件数:" + data.length)

  if(data.length == 100){
    console.log("ISSUEが100件を超えました。ページ番号=" + issuePage)
    issuePage++
    getIssues();
    return
  }

  if(compFlg == false){
    compFlg = true;
  } else {
    writeResult()
  }
}

/**
* MergeRequestsを取得する
*/
function getMergeRequests(){

  var milestone = selectMilestone;
  var method = "GET";
  var successFunc = mergeRequestsResult;
  var url = "/groups/" + GROUP_ID + "/merge_requests";
  var request = "private_token=" + TOKEN + "&per_page=100&milestone=" + milestone + "&page=" + mergeRequestPage;
  sendAjaxRequest(method, url, request, successFunc)

}

/*
* 全MRを集計できたか判定。→まだの場合、再度取得処理を実施。
*/
function mergeRequestsResult(data){

  mrList = mrList.concat(data)

  console.log("MergeReques件数:" + data.length)

  if(data.length == 100){
    console.log("MergeRequestが100件を超えました。ページ番号=" + issuePage)
    mergeRequestPage++
    getMergeRequests();
    return
  }

  if(compFlg == false){
    compFlg = true;
  } else {
    writeResult()
  }
}


/**
* 結果を表に出力する
*/
function writeResult(){

  var issueSmmaries = summaryTime(issueList)
  var mergeRequestSmmaries = summaryTime(mrList)

  var issueSmmary = issueSmmaries.array;
  var mergeRequestSmmary = mergeRequestSmmaries.array;
  var issueLabelSmmary = issueSmmaries.labelArray;
  var mergeRequestLabelSmmary = mergeRequestSmmaries.labelArray;
  var allLabel = issueSmmaries.allLabel;
  var allLabelMR = mergeRequestSmmaries.allLabel;

  var array = {};
  var labelArray = {};



  //MRの情報をissueの情報と結合する
  //全issueを集計
  for(var i in issueSmmary){
     array[i] = issueSmmary[i]
     if(mergeRequestSmmary[i]){
       array[i].merge_request_total_time_spent = mergeRequestSmmary[i].total_time_spent
     } else {
       array[i].merge_request_total_time_spent = 0
     }
  }

  //label毎に集計
  for(var i in issueLabelSmmary){
    labelArray[i] = issueLabelSmmary[i]
    labelArray[i].name = i      //ここでname属性を付与し、検索で引っかかるようにする
    if(mergeRequestLabelSmmary[i]){
      labelArray[i].merge_request_total_time_spent = mergeRequestLabelSmmary[i].total_time_spent
    } else {
      labelArray[i].merge_request_total_time_spent = 0
    }
  }

  allLabel.merge_request_total_time_spent = allLabelMR.total_time_spent
  labelArray["すべて"] = allLabel;

  //console.log(array)
  //console.log(labelArray)

  //グローバル変数に格納
  labelIssueList = labelArray;

  // labelの一覧選択を更新
  updateLabelSelect();

  //出力
  document.getElementById("result").innerHTML = updateIssueTable(array)
  document.getElementById("result-by-tags").innerHTML = updateIssueTable(labelArray)

  //Issue一覧を作成
  createIssueList("");

  //更新時刻を更新
  document.getElementById("update-date-time").innerHTML = "更新日時： " + getNow();

  // ボタンを活性にする
  document.getElementById("get-info-btn").disabled = false;

}


//ISSUE、MRの時間を集計
function summaryTime(data){

  var labelArray = {};
  var array = {};
  var ret = {};


  // var today = new Date()
  // var todayDate = tmpDate.getFullYear() + "-" + ("00" + (tmpDate.getMonth() + 1)).slice(-2) + "-" + ("00" + tmpDate.getDate()).slice(-2)
  var allLabel = {
    issue_count: 0,
    comp_issue_count: 0,
    name: "すべて",
    time_estimate: 0,
    total_time_spent: 0,
  }

  for(var i in data){

    var id = 0

    //完了フラグ
    var compFlg = false;
    if(data[i].state == "closed" || data[i].labels.indexOf("Done")  > -1){
      compFlg = true;
    }

    if(data[i].assignee){
      id = data[i].assignee.id
    } else {
      data[i].assignee = {}
      data[i].assignee.id = 0
      data[i].assignee.name = "未割当"
    }


    // idがない場合
    if(!array[id]){
      array[id] = {}
      array[id].name = data[i].assignee.name
      array[id].issue_count = 0
      array[id].time_estimate = 0
      array[id].total_time_spent = 0
    }

    array[id].issue_count++;
    array[id].time_estimate += data[i].time_stats.time_estimate
    array[id].total_time_spent += data[i].time_stats.total_time_spent
    if(compFlg){
      array[id].comp_issue_count ++
    }


    //タグ別一覧の配列を作成
    var labels = data[i].labels

    for(var j in labels){

      if(labels[j] == "Done"){
        compFlg = true
      }

      // 特定のラベルは飛ばす
      if(labels[j] == "To Do" || labels[j] == "Doing" || labels[j] == "Done" ){
        continue;
      }

      if(!labelArray[labels[j]]) {
        labelArray[labels[j]] = {}
        labelArray[labels[j]].issue_count = 0
        labelArray[labels[j]].comp_issue_count = 0
        labelArray[labels[j]].time_estimate = 0
        labelArray[labels[j]].total_time_spent = 0
      }
      labelArray[labels[j]].issue_count ++
      labelArray[labels[j]].time_estimate += data[i].time_stats.time_estimate
      labelArray[labels[j]].total_time_spent += data[i].time_stats.total_time_spent
      if(compFlg){
        labelArray[labels[j]].comp_issue_count ++
      }
    }

    //allLabelの集計
    allLabel.issue_count ++
    allLabel.time_estimate += data[i].time_stats.time_estimate
    allLabel.total_time_spent += data[i].time_stats.total_time_spent
    if(compFlg){
      allLabel.comp_issue_count ++
    }

  }
  ret.array = array
  ret.labelArray = labelArray
  ret.allLabel = allLabel
  return ret
}


/*
* issue/MRの表を更新するhtmlを返却
*/
function updateIssueTable(array){

  var html = "";
  for(var i in array){
		html += "<tr>"
		html += "<td>" + array[i].name + "</td>";
		html += "<td>" + array[i].issue_count + "</td>";
		html += "<td>" + round(array[i].time_estimate / 3600, 2) + "</td>";
		html += "<td>" + round(array[i].total_time_spent / 3600, 2) + "</td>";
		html += "<td>" + round(array[i].merge_request_total_time_spent / 3600, 2) + "</td>";
		html += "</tr>"
  }
  return html;
}


/*
* issueの一覧（プルダウンリスト）を更新
*/
function createIssueList(searchWord){
  var html = "";
  for(var i in issueList){
    //openedのもののみ一覧化
    if(issueList[i].state == "opened" && issueList[i].title.indexOf(searchWord) != -1){
      html += "<option value='" + issueList[i].project_id +":" + issueList[i].iid + "'>" + issueList[i].title + "</option>";
    }
  }
  //issueの選択肢を更新
  document.getElementById("issue").innerHTML = html;
}

/*
* issue名の検索欄が変更された時
*/
function changeSearchIssueName(){
  if(issueList.length == 0){
    console.log("issueリストが空で、検索できません")
    return false;
  }
  var searchIssueName = document.getElementById("search-issue-name").value;
  createIssueList(searchIssueName)
}

/*
* ラベルの検索欄が変更された時
*/
function changeLabelName(){
  if(!labelIssueList){
    alert("マイルストーンが選択されていません\n「ISSUEを集計」の送信ボタンを押してください")
    return false;
  }

  var labelName = document.getElementById("label-name").value;
  var array = {}
  for(var i in labelIssueList){
    if(labelIssueList[i].name.indexOf(labelName) != -1){
        array[i] = labelIssueList[i]
    }
  }

  //グラフ表示するかどうか
  var graphDisplayFlg = document.getElementById("graph-display-flg").checked

  //初期化
  if(labelChart){
    labelChart.destroy()
  }

  if(graphDisplayFlg){
    $("#label-table").css("display", "none")
    //グラフ描画
    createGraph(array)

  } else {
    $("#label-table").css("display", "")
    // $("#label-chart").css("display", "none")
    document.getElementById("result-by-tags").innerHTML = updateIssueTable(array)
  }

}



/***********************************************************
* 初期化処理
*************************************************************/

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

	console.log(data);

	var array = {};
	for(var i in data){
		array[data[i].id] = {}
		array[data[i].id].title = data[i].title
	}
	var html = "";
	for(var i in array){
		html += "<option value='" + array[i].title +"'>" + array[i].title + "</option>";
	}
  document.getElementById("milestone").innerHTML = html;

  //テンプレート作成用
  html = "<option value='0'>--マイルストーン未選択--</option>";
	for(var i in array){
		html += "<option value='" + i +"'>" + array[i].title + "</option>";
	}
	document.getElementById("select-milestone").innerHTML = html;

  milestoneList = data;
}

/**
* プロジェクトの一覧を取得
*/
function getProjectList(){

  var method = "GET";
  var successFunc = writeProjectsList;
  var url =  "/groups/" + GROUP_ID + "/projects";
  var request = "private_token=" + TOKEN;
  sendAjaxRequest(method, url, request, successFunc)

}
/**
* プロジェクトの一覧を設定
*/
function writeProjectsList(data){

	var html = "<option value='0'>--プロジェクトを選択してください--</option>";
  for(var i in data){
    html += "<option value='" + data[i].id +"'>" + data[i].name + "</option>";
  }
  document.getElementById("select-project").innerHTML = html;

  var array = {}
  for(var i in data){
    array[data[i].id] = {}
    array[data[i].id].name = data[i].name
  }
  projectList = array
}

/***********************************************************
* ISSUE作成処理（テンプレート）
*************************************************************/

/**
* テンプレートを取得する
*/
function getTemplate(){

  var issue_name = document.getElementById("issue-name").value
  if(issue_name == ""){
    document.getElementById("createIssueResult").innerHTML = "※※※ISSUEの名前を入力してください※※※";
    return
  }

  var project_id = document.getElementById("select-project").value
  var template_file = document.getElementById("select-template").value

  //グローバルテンプレートの使用判定
  var globalTemplateFlg = document.getElementById("global-template-flg").checked
  if(globalTemplateFlg){
    project_id = GROBAL_TEMPLATE_PROJECT_ID
  }

	//テンプレートファイルのリポジトリトップからのパス
	var templatePath = ".gitlab/issue_templates/" + template_file

	var method = "GET";
	var successFunc = createIssue;
  var failFunc = templateNotFound;

 	var url = "/projects/" + project_id + "/repository/files/" + encodeURIComponent(templatePath) + "/raw";
 	var request = "private_token=" + TOKEN + "&ref=master";
	sendAjaxRequest(method, url, request, successFunc, failFunc)

}

/**
* ISSUEを作成する
*/
function createIssue(data){

	console.log(data)

	// var issue = document.getElementById("issue").value;
  var issue = document.getElementById("issue-name").value
  var project_id = document.getElementById("select-project").value
  var milestone_id = document.getElementById("select-milestone").value

	var description = encodeURIComponent(data)
	// var label = "todo,week"

  var milestone = "";
  if(milestone_id != 0){
    milestone = "&milestone_id=" + milestone_id;
  }


	var method = "POST";
	var successFunc = writeCreateIssueResult;
 	var url = "/projects/" + project_id + "/issues";
	var request = "private_token=" + TOKEN + "&title=" + encodeURIComponent(issue) + "&description=" + description + milestone
	sendAjaxRequest(method, url, request, successFunc)

}

/**
* 作成結果を出力する
*/
function writeCreateIssueResult(data){

  console.log(data)
  var id = data.id;
  var title = data.title;
  var web_url = data.web_url;
  var html = "<a href='" + web_url + "' target='_blank'>#" + id + " : " + title + "</a> を作成しました"
  document.getElementById("createIssueResult").innerHTML = html;
}


/***********************************************************
* ISSUE作成処理（継続ISSUE）
*************************************************************/


//前回のissueの番号
var continueIssueId = 0
//新しい継続issueの番号
var newContinueIssueId = 0
//継続issueのプロジェクトID
var continueIssueProjectId = 0
// 残りのループ回数
var restLoopCount = 0

/**
* 継続ISSUEの情報を取得する
*/
function getIssueContinue(){

  var issue = document.getElementById("issue").value;

  if(!issue){
    alert("マイルストーンが選択されていません\n「ISSUEを集計」の送信ボタンを押してください")
    return false;
  }


  // ボタンを非活性にする
  document.getElementById("get-issue-continue-btn").disabled = true;

  var arr = issue.split(':')
  var project_id = arr[0]
  var iid = arr[1]

  var method = "GET";
  var successFunc = createIssueContinue;
  //var successFunc = sysout;
  var url = "/projects/" + project_id + "/issues/" + iid;
  var request = "private_token=" + TOKEN
  sendAjaxRequest(method, url, request, successFunc)

}

/**
* 継続ISSUEを作成する
*/
function createIssueContinue(data){

  console.log(data)

  var description = data.description
  var labels = data.labels
  var project_id = data.project_id
  var issue_iid = data.iid
  var title = data.title;

  //元issueの番号を保存
  continueIssueId = issue_iid
  continueIssueProjectId = project_id

  //すでに継続issueだった場合、継続の文字を取り除く
  var index = title.indexOf(" 継続#");
  if(index != -1){
    title = title.slice(0, index)
  }
  title += " 継続#" + issue_iid;

  var method = "POST";
  var successFunc = writecreateIssueResultContinue;
  var url = "/projects/" + project_id + "/issues";
  var request = "private_token=" + TOKEN + "&title=" + encodeURIComponent(title) + "&description=" + encodeURIComponent(description) + "&labels=" + encodeURIComponent(labels);
  sendAjaxRequest(method, url, request, successFunc)

}

/**
* 継続ISSUEの作成結果を出力する
*/
function writecreateIssueResultContinue(data){

  console.log(data)
  var id = data.iid;
  var title = data.title;
  var web_url = data.web_url;
  var html = "<a href='" + web_url + "' target='_blank'>#" + id + " : " + title + "</a> を作成しました"
  document.getElementById("createIssueResultContinue").innerHTML = html;

  //リンクの設定
  newContinueIssueId = id
  getIssueLinks()
}


/**
* リンクの取得
*/
function getIssueLinks(){

    var method = "GET";
    var successFunc = createIssueLinks;
    var url = "/projects/" + continueIssueProjectId + "/issues/" + continueIssueId + "/links";
    var request = "private_token=" + TOKEN;
    sendAjaxRequest(method, url, request, successFunc)
}


/**
* リンクの設定
*/
function createIssueLinks(data){

    //ループ用にデータを格納する
    var ids = [];
    ids.push(continueIssueId)
    for(var i in data){
      var id = data[i].iid;
      ids.push(id)
    }

    //ループ回数を定義（非同期処理のカウンター）
    restLoopCount = ids.length

    var method = "POST";
    var successFunc = createIssueLinksResult;
    var url = "/projects/" + continueIssueProjectId + "/issues/" + newContinueIssueId + "/links";

    //処理を実施
    for(var i = 0; i< ids.length ;i++){
      var request = "private_token=" + TOKEN + "&target_project_id=" + continueIssueProjectId + "&target_issue_iid=" + ids[i] ;
      sendAjaxRequest(method, url, request, successFunc)
    }
}

/**
* リンク作成の結果を取得、すべてのリンクを作成したら、ボタンを元に戻す
*/
function createIssueLinksResult(data){
    restLoopCount--
    console.log("リンク作成中 残りループ：" + restLoopCount)
    if(restLoopCount == 0){
      //変数初期化
      continueIssueId = 0
      newContinueIssueId = 0
      continueIssueProjectId = 0
      // ボタンを非活性を解除する
      document.getElementById("get-issue-continue-btn").disabled = false;
    }
};


/***********************************************************
* テンプレートの表示切替処理
*************************************************************/


/**
* テンプレート一覧を取得する
*/
function getTemplateList(){

  var project_id = document.getElementById("select-project").value;

  //グローバルテンプレートの使用判定
  var globalTemplateFlg = document.getElementById("global-template-flg").checked
  if(globalTemplateFlg){
    project_id = GROBAL_TEMPLATE_PROJECT_ID
  }

	//テンプレートファイルのリポジトリトップからのパス
	var templatePath = ".gitlab/issue_templates/"

	var method = "GET";
	var successFunc = writeTemplateList;
  var failFunc = templateNotFound;
 	var url = "/projects/" + project_id + "/repository/tree/";
 	var request = "private_token=" + TOKEN + "&path=" + encodeURIComponent(templatePath) + "&ref=master";
	sendAjaxRequest(method, url, request, successFunc, failFunc)
}

/**
* テンプレートが見つからないときの処理
*/
function templateNotFound(data){
    console.log(data)
    document.getElementById("createIssueResult").innerHTML = "※※※テンプレートファイルが見つかりません※※※";

    var html = "<option value='0'>--テンプレートファイルが見つかりません--</option>";
    document.getElementById("select-template").innerHTML = html;

}


/**
* テンプレート一覧を表示する
*/
function writeTemplateList(data){

  var array = {}

  array[0] = {}
  array[0].name = "--　templateを選択してください　--"

  document.getElementById("createIssueResult").innerHTML = "";

  for(var i in data){
    if(data[i].name.indexOf(".md") != -1){
      array[data[i].id] = {}
      array[data[i].id].name = data[i].name
    }
  }

  var html = "";
  for(var i in array){
    html += "<option value='" + array[i].name +"'>" + array[i].name + "</option>";
  }

  // console.log(array)
  document.getElementById("select-template").innerHTML = html;
}


/***********************************************************
* CSVダウンロード処理
*************************************************************/

/*
* csvダウンロード機能
*/
function csvDownload() {

  //入力チェック
  if(issueList.length == 0){
    alert("マイルストーンが選択されていません\n「ISSUEを集計」の送信ボタンを押してください")
    return false;
  }

  //ヘッダーを作成
  var content = "type" + ","
              + "project" + ","
              + "id" + ","
              + "title" + ","
              + "milestone" + ","
              + "assignee" + ","
              + "labels" + ","
              + "state" + ","
              + "time_estimate(s)" + ","
              + "total_time_spent(s)" + ","
              + "created_at" + ","
              + "updated_at" + ","
              + "closed_at" + ","
              + "web_url" + ","
              + "\n"

  // 明細の作成
  content += createDetail(issueList, "ISSUE")
  content += createDetail(mrList, "Merge Request")

  //書き出し処理
  var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  var blob = new Blob([ bom, content ], { "type" : "text/csv" });

  if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(blob, "test.csv");

      // msSaveOrOpenBlobの場合はファイルを保存せずに開ける
      window.navigator.msSaveOrOpenBlob(blob, "test.csv");
  } else {
      document.getElementById("download").href = window.URL.createObjectURL(blob);
  }
}

/*
* 明細作成処理
*/
function createDetail(array, type){

  var content = "";

  //明細を作成
  for(var i in array){

    var id = array[i].id
    var title = array[i].title
    var milestone_title = "未割当"
    var assignee_name = "未割当"
    var created_at = array[i].created_at
    var labels = ""
    var project_name = projectList[array[i].project_id].name
    var state = array[i].state
    var time_estimate = array[i].time_stats.time_estimate
    var total_time_spent = array[i].time_stats.total_time_spent
    var updated_at = array[i].updated_at
    var closed_at = array[i].closed_at
    var web_url = array[i].web_url

    if(array[i].assignee){
      assignee_name = array[i].assignee.name
    }

    if(array[i].milestone){
      milestone_title = array[i].milestone.title
    }

    var multiflg = false; //複数件チェック用フラグ
    for(var j in array[i].labels){

      //複数件ある場合は、区切り文字を入れる
      if(multiflg){
        labels += "|"
      } else {
        multiflg = true;
      }

      labels += array[i].labels[j]
    }

    content += type + ","
            + project_name + ","
            + id + ","
            + title + ","
            + milestone_title + ","
            + assignee_name + ","
            + labels + ","
            + state + ","
            + time_estimate + ","
            + total_time_spent + ","
            + created_at + ","
            + updated_at + ","
            + closed_at + ","
            + web_url + ","
            + "\n"
  }
  return content;
}


/***********************************************************
* グラフ表示処理
*************************************************************/

var option = {
  title: {
    display: true,
    text: 'ラベル別時間'
  },
  tooltips: {
    mode: 'index',
    intersect: false
  },
  responsive: true,
  scales: {
    xAxes: [{
      stacked: true,
      scaleLabel: {                 // 軸ラベル
          display: true,            // 表示設定
          labelString: 'ラベル',    // ラベル
          fontSize: FONT_SIZE       // フォントサイズ
      }
    }],
    yAxes: [{
      stacked: true,
      scaleLabel: {                 // 軸ラベル
          display: true,            // 表示設定
          labelString: '時間(h)',    // ラベル
          fontSize: FONT_SIZE       // フォントサイズ
      }
    }]
  }
}

/*
* グラフの描画処理
*/
function createGraph(array){

  // console.log(array)
  var labels = []
  var issueSpent = []
  var issueEstimate = []
  var mrSpent = []

  for(var i in array){
    labels.push(i);
    issueSpent.push(round(array[i].total_time_spent/3600, 2));
    issueEstimate.push(round(array[i].time_estimate/3600, 2));
    mrSpent.push(round(array[i].merge_request_total_time_spent/3600, 2));
  }

  // console.log(labels, issueSpent, issueEstimate)

  //グラフ作成処理（バーンアップ）
  var ctx = document.getElementById("label-chart");
  labelChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'estimate',
          data: issueEstimate,
          backgroundColor: "rgba(0,0,255,0.5)",
          borderColor:"rgba(0,0,255,0.5)",
          stack: 'Stack 1',
        },
        {
          label: 'spend',
          data: issueSpent,
          backgroundColor: "rgba(255,0,0,0.5)",
          borderColor:"rgba(255,0,0,0.5)",
          stack: 'Stack 0',
        },
        {
          label: 'spendMR',
          data: mrSpent,
          backgroundColor: "rgba(0,100,0,0.5)",
          borderColor:"rgba(0,100,0,0.5)",
          stack: 'Stack 0',
        }
      ],
    },
    options: option
  });


}


/**
* labelのセレクトボックスを更新する
*/
function updateLabelSelect(){

  var html = ""
  for(var i in labelIssueList){
    html += "<option value='" + i  + "'>" + i + "</option>";
  }
  document.getElementById("select-label").innerHTML = html
}




console.log("read completed")
console.log("RELEASE_VERSION:" + RELEASE_VERSION)
