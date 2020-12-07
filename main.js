//gitlabのtoken情報
const TOKEN = ""
const GIT_URL = "https://x.x.x.x/api/v4"
var work
var issueList

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
	var labelArray = {};
	issueList = {}

	for(var i in data){
		//console.log(data[i])
		//console.log(data[i].assignee.id)
		//console.log(data[i].time_stats.time_estimate)
		//console.log(data[i].time_stats.total_time_spent)
		
		// issueのリストに追加
		issueList[data[i].id] = {}
		issueList[data[i].id].title = data[i].title
		issueList[data[i].id].state = data[i].state
		
		
		
		var id = 0
		
		if(data[i].assignee){
			id = data[i].assignee.id
		}
		
		if(array[id]){

			//console.log("ある場合")
			array[id].issue_count++;
			array[id].time_estimate += data[i].time_stats.time_estimate
			array[id].total_time_spent += data[i].time_stats.total_time_spent
			
		} else {

			//console.log("ない場合")
			array[id] = {}
			array[id].name = data[i].assignee.name
			array[id].issue_count = 1;
			array[id].time_estimate = data[i].time_stats.time_estimate
			array[id].total_time_spent = data[i].time_stats.total_time_spent

		}
		
		//タグ別一覧の配列を作成
		var labels = data[i].labels
		var project_id = data[i].project_id
		
		//初回
		if(!labelArray[project_id]){
			labelArray[project_id] = {}
		}

		for(var j in labels){
			if(!labelArray[project_id][labels[j]]) {
				labelArray[project_id][labels[j]] = {}
				labelArray[project_id][labels[j]].issue_count = 0
				labelArray[project_id][labels[j]].time_estimate = 0
				labelArray[project_id][labels[j]].total_time_spent = 0
			}
			labelArray[project_id][labels[j]].issue_count ++
			labelArray[project_id][labels[j]].time_estimate += data[i].time_stats.time_estimate
			labelArray[project_id][labels[j]].total_time_spent += data[i].time_stats.total_time_spent
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
	
	//タグ別一覧の合計を計算
	var sumArray = {}
	for(var i in labelArray){
		for(var j in labelArray[i]){
		
			console.log(j)
			if(!sumArray[j]){
				sumArray[j] = {}
				sumArray[j].issue_count = 0
				sumArray[j].time_estimate = 0
				sumArray[j].total_time_spent = 0
			}
			sumArray[j].issue_count += labelArray[i][j].issue_count
			sumArray[j].time_estimate += labelArray[i][j].time_estimate
			sumArray[j].total_time_spent += labelArray[i][j].total_time_spent
					
		}

	
	}
	
	labelArray[0] = sumArray
	work = labelArray;
	updateIssueTable(labelArray[0])
	
	
	
	//Issue一覧を作成
	html = "";
	for(var i in issueList){
		//openedのもののみ一覧化
		if(issueList[i].state == "opened"){
			html += "<option value='" + i +"'>" + issueList[i].title + "</option>";
		}
	}	
	document.getElementById("issue").innerHTML = html;


}

function updateIssueTable(array){

	var html = "";
	for(var j in array){

		html += "<tr>"
		html += "<td>" + j + "</td>";
		html += "<td>" + array[j].issue_count + "</td>";
		html += "<td>" + array[j].time_estimate / 3600 + "</td>";
		html += "<td>" + array[j].total_time_spent / 3600 + "</td>";
		html += "</tr>"

	}

	console.log(html)
	document.getElementById("result-by-tags").innerHTML = html;
	
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




/**
* マイルストーンの一覧を取得
*/
function getProjectList(){

	var method = "GET";
	var successFunc = writeProjectsList;
 	var url =  "/groups/4/projects";
	var request = "private_token=" + TOKEN;
	sendAjaxRequest(method, url, request, successFunc)

}


/**
* ISSUEの一覧を設定
*/
function writeProjectsList(data){

	var array = {}
	
	array[0] = {}
	array[0].name = "すべて"
	
	for(var i in data){
		array[data[i].id] = {}
		array[data[i].id].name = data[i].name
	}
	
	var html = "";
	for(var i in array){
		html += "<option value='" + i +"'>" + array[i].name + "</option>";
	}
	
	console.log(array)
	
	document.getElementById("project").innerHTML = html;

}

/**
* ISSUEの一覧を切り替え
*/
function changeIssueSummary(){

	if(!work){
		console.log("まだないよ")
		return false;
	}
	
	var project_id = document.getElementById("project").value;
	updateIssueTable(work[project_id])

}


/**
* 継続ISSUEの情報を取得する
*/
function getIssueContinue(){

	var issue = document.getElementById("issue").value;

	var method = "GET";
	var successFunc = createIssueContinue;
 	var url = "/issues/" + issue;
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
		var html = "#" + id + " : " + title + " を作成しました"
		document.getElementById("createIssueResultContinue").innerHTML = html;

}



console.log("read completed")
