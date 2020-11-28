//gitlabのtoken情報
const TOKEN = "xxxx"
const GIT_URL = "https://xxxx/api/v4"

/**
 * Ajax通信用のメソッド
 * @param method : GET, POST
 * @param url : リクエスト先のURL
 * @param request : requestのjson
 * @param successFunc : リクエスト成功時に起動するfunction
 * @returns
 */
 function sendAjaxRequest(method, url, request, successFunc){

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
			 alert("リクエスト時になんらかのエラーが発生しました：");
		 });
 }


/**
* ISSUEを取得し、集計する
*/
function getIssues(){

	//
	var milestone = document.getElementById("milestone").value;

	var method = "GET";
	var successFunc = writeResult;
 	var url = "/groups/4/issues";
 	var request = "private_token=" + TOKEN + "&milestone=" + milestone;
	sendAjaxRequest(method, url, request, successFunc)

}


/**
* 結果を出力する
*/
function writeResult(data){

	console.log(data);

	var array = {};

	for(var i in data){
		//console.log(data[i])
		//console.log(data[i].assignee.id)
		//console.log(data[i].time_stats.time_estimate)
		//console.log(data[i].time_stats.total_time_spent)

		if(array[data[i].assignee.id]){

			//console.log("ある場合")
			array[data[i].assignee.id].issue_count++;
			array[data[i].assignee.id].time_estimate += data[i].time_stats.time_estimate
			array[data[i].assignee.id].total_time_spent += data[i].time_stats.total_time_spent

		} else {

			//console.log("ない場合")
			array[data[i].assignee.id] = {}
			array[data[i].assignee.id].name = data[i].assignee.name
			array[data[i].assignee.id].issue_count = 1;
			array[data[i].assignee.id].time_estimate = data[i].time_stats.time_estimate
			array[data[i].assignee.id].total_time_spent = data[i].time_stats.total_time_spent

		}
	}
	//console.log(array)
	var html = "";

	for(var i in array){

		html += "<tr>"
		html += "<td>" + array[i].name + "</td>";
		html += "<td>" + array[i].issue_count + "</td>";
		html += "<td>" + array[i].time_estimate / 3600 + "</td>";
		html += "<td>" + array[i].total_time_spent / 3600 + "</td>";
		html += "</tr>"

	}

	//console.log(html)
	document.getElementById("result").innerHTML = html;

}


/**
* ISSUEを作成する
*/
function createIssue(data){

	console.log(data)

	var issue = document.getElementById("issue").value;
	var description = encodeURIComponent(data)
	var label = "todo,week"

	var method = "POST";
	var successFunc = writeCreateIssueResult;
 	var url = "/projects/2/issues";
	var request = "private_token=" + TOKEN + "&title=" + encodeURIComponent(issue) + "&description=" + description + "&labels=" + encodeURIComponent(label);
	sendAjaxRequest(method, url, request, successFunc)

}

/**
* 作成結果を出力する
*/
function writeCreateIssueResult(data){

		console.log(data)
		var id = data.id;
		var title = data.title;
		var html = "#" + id + " : " + title + " を作成しました"
		document.getElementById("createIssueResult").innerHTML = html;

}




/**
* 標準出力する
*/
function sysout(data){
		console.log(data)
}

/**
* テンプレートを取得する
*/
function getTemplate(){

	//テンプレートファイルのリポジトリトップからのパス
	var templatePath = ".gitlab/issue_templates/logtemplate.md"

	var method = "GET";
	var successFunc = createIssue;
 	var url = "/projects/2/repository/files/" + encodeURIComponent(templatePath) + "/raw";
 	var request = "private_token=" + TOKEN + "&ref=master";
	sendAjaxRequest(method, url, request, successFunc)

}


/**
* マイルストーンの一覧を取得
*/
function getMilestoneList(){

	var method = "GET";
	var successFunc = writeMilestoneList;
 	var url =  "/groups/4/milestones";
	var request = "private_token=" + TOKEN;
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

	//console.log(array);

	var html = "";
	for(var i in array){
		html += "<option value='" + array[i].title +"'>" + array[i].title + "</option>";
	}

	//console.log(html)
	document.getElementById("milestone").innerHTML = html;
}

/**
* 毎週水曜日の日付を設定する
*/
function setDate(){

	var now = new Date();
	var date = now.getDate() - now.getDay() + 3
	var month = now.getMonth() + 1
	var str = month + "/" + date + " week"
	document.getElementById("issue").value = str;


}


console.log("read completed")
