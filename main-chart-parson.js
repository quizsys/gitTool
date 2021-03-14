//グローバル変数の宣言
var parsonChart = null
var selectUserId = 0
var countParsonIssue = 0
var parsonIssueList = []

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



/**
* 処理開始
*/
function getInfoParsonChart(userId){

		//入力チェック
		if(issueList.length == 0){
      alert("マイルストーンが選択されていません\n「ISSUEを集計」の送信ボタンを押してください")
			return;
		}

		if(userId == 0){
			alert("ユーザを選択してください")
			return;
		}

    //チャートがあれば初期化
    if(parsonChart){
      parsonChart.destroy()
    }

		// 初期化
		parsonIssueList = []
		selectUserId = userId
		//取得処理
		getInfoParsonIssue(userId)
}



/**
* 時間詳細情報を取得
*/
function getInfoParsonIssue(userId){

		var checkArr = []

		// issueの一覧から該当ユーザの情報のみ取得
		for(var i in issueList){
			if(issueList[i].assignee.id == userId && issueList[i].time_stats.total_time_spent > 0){
				checkArr.push({
					project_id: issueList[i].project_id,
					iid: issueList[i].iid,
					kind: "/issues/"
				})
			}
		}

		// MRの一覧から該当ユーザの情報のみ取得
		for(var i in mrList){
			if(mrList[i].assignee.id == userId && mrList[i].time_stats.total_time_spent > 0){
				checkArr.push({
					project_id: mrList[i].project_id,
					iid: mrList[i].iid,
					kind: "/merge_requests/"
				})
			}
		}
		// console.log(checkArr)
		// console.log(checkArr.length)

		//対象なければ、終了
		if(checkArr.length == 0){
			return false;
		}

		//カウンターをセット
		countParsonIssue = checkArr.length

		var method = "GET";
    var successFunc = writeInfoParsonIssue
		var request = "private_token=" + TOKEN + "&per_page=100";

		for(var i in checkArr){
			var url = GIT_URL + "/projects/" + checkArr[i].project_id + checkArr[i].kind + checkArr[i].iid + "/discussions";
		  sendAjaxRequest2(method, url, request, successFunc, checkArr[i].project_id)
		}
}

/*
* discussions情報をもとに日ごとの時間を算出し、配列に格納し、終了チェックする
*/
function writeInfoParsonIssue(data, project_id){

	for(var i in data){
		var d = data[i].notes[0];
		if(d.system == true && d.body.indexOf('of time spent at') > -1){

			var createdDate = d.created_at.slice(0,10)
			var spendTime = calcTimeSpend(d.body)
			parsonIssueList.push({
				project_id: project_id,
				createdDate : createdDate,
				spendTime : spendTime
			})
    }
	}

	//終了チェック
	countParsonIssue --
	if(countParsonIssue == 0){
		createChartParson();
	}

}





// 時間を抽出
function calcTimeSpend(str){

	var ret = 0

	var strArr = str.split(" ")
	var timeStr = strArr[1]
	if(timeStr.indexOf("h") != -1){
		ret = timeStr.replace("h", "") * 3600
    //分もある場合
    if(strArr[2].indexOf("m") != -1){
      ret += strArr[2].replace("m", "") * 60
    }
	} else if(timeStr.indexOf("m") != -1){
		ret = timeStr.replace("m", "") * 60
	}


	// 減らす場合はマイナス
	if(strArr[0] == "subtracted"){
		ret = ret * (-1)
	}
	return ret

}

function createChartParson(){
		console.log("createChartParson")
		dataCreaet()
}






/**
* グラフ表示用のデータを作成する
*/
function dataCreaet(){

	var data = parsonIssueList;
  // console.log(parsonIssueList)


	// var s = '['
	// 	+ '{"project_id":2,"createdDate":"2021-02-12","spendTime":1800},'
	// 	+ '{"project_id":2,"createdDate":"2021-02-12","spendTime":3600},'
	// 	+ '{"project_id":2,"createdDate":"2021-02-13","spendTime":9000},'
	// 	+ '{"project_id":1,"createdDate":"2021-02-12","spendTime":1800},'
	// 	+ '{"project_id":4,"createdDate":"2021-02-12","spendTime":3600},'
	// 	+ '{"project_id":5,"createdDate":"2021-02-13","spendTime":9000}'
	// 	+ ']'
	// var data = JSON.parse(s)

  var labels = getDateListFromMilestone();
  // var labels = ["2021-02-11", "2021-02-12", "2021-02-13", "2021-02-14"]
	var dataList = [];
	var prjList = []

	for(var i in data){

		var project_id = data[i].project_id
		var spendTime  = data[i].spendTime
		var createdDate =  data[i].createdDate

		var index = labels.indexOf(createdDate)
		if(index != -1){
			if(!dataList[project_id]){
				dataList[project_id] = []
				// prjList[project_id] = projectList[project_id].name
				prjList[project_id] = "プロジェクト" + project_id
			}
			if(!dataList[project_id][index]){
				dataList[project_id][index] = 0
			}
			dataList[project_id][index] += round((spendTime / 3600) , 2)
		}
	}

		// console.log(labels)
		// 	console.log(dataList)

  // グラフを描画
  createPasonIssueChart(labels, dataList, prjList)


}


/*
* チャートを作成
*/
function createPasonIssueChart(labels, dataList, prjList){

	var title = "プロジェクト別時間(" + userList[selectUserId] + ")"

	// グラフのオプション
	var pasonIssueChartOption = {
		title: {
			display: true,
			text: title,
			fontSize: FONT_SIZE + 4,
	    responsive: true,
		},
		plugins: {
			datalabels: {
					// color: '#000',
					font: {
							weight: 'bold',
							size: FONT_SIZE,
					},
          display: true,  //データラベルをグラフ上に表示するか
			},
		},
		scales: {                          // 軸設定
				xAxes: [                           // Ｘ軸設定
						{
								scaleLabel: {                 // 軸ラベル
										display: true,                // 表示設定
										labelString: '日付',    // ラベル
										fontSize: FONT_SIZE                   // フォントサイズ
								},
								ticks: {
									fontSize: FONT_SIZE                   // フォントサイズ
								}
						}
				],
				yAxes: [                           // Ｙ軸設定
						{
	            id: "y-axis-1",   // Y軸のID
	            position: "left", // どちら側に表示される軸か？
							stacked: true,
							scaleLabel: {                  // 軸ラベル
									display: true,                 // 表示の有無
									labelString: 'spent time（h）',     // ラベル
									fontSize: FONT_SIZE                   // フォントサイズ
							},
	            ticks: {
								autoSkip: true,                // 幅を小さくした場合に自動で表示数を減らす
								maxTicksLimit:10,
								fontSize: FONT_SIZE                   // フォントサイズ
	            }
	          }
				]
		}
	}

	var chartData =  {
		type: 'bar',
		data: {
			labels: labels,
			datasets: [],
		},
		options: pasonIssueChartOption,
	}

	// グラフの透過度を設定
	var opacity = 0.5

	// データの追加
	for(var i in prjList){

		var color = selectColor(i)
		chartData.data.datasets.push({
			label: prjList[i],
			data: dataList[i],
			backgroundColor: "rgba(" + color[0] + "," + color[1]  + "," + color[2] + "," + opacity + ")",
			stack: 'Stack 0',
			yAxisID: "y-axis-1"
		})
	}


	//グラフ作成処理
	var ctx = document.getElementById("pasonIssueChart");
	parsonChart = new Chart(ctx,chartData);
	ctx = document.getElementById("pasonIssueChart");
	console.log(ctx.style.width)
	console.log(ctx.style.height)

	var width = Number.parseInt(ctx.style.width.replace("px", ""))
	var height = Number.parseInt(ctx.style.height.replace("px", ""))

	ctx.style.width = (width * 0.8) + "px"
	ctx.style.height = (height * 0.8) + "px"
	ctx.style.marginLeft =  (width * 0.1) + "px"
}

/*
* 順番に応じた色を返す（用意していた種類以上の場合、一番最後の色を返す）
*/
function selectColor(num){

	if(num < colorList.length){
		return colorList[num]
	} else {
		return colorList[colorList.length -1]
	}
}

/**
* 色リスト
*/
var colorList = [
	[	240	,	248	,	255],  //	aliceblue
	[		0	,	128	,		0],  //	green
	[	255	,	99	,	71],  //	tomato
	[	128	,		0	,	128],  //	purple
	[		0	,		0	,	128],  //	navy
	[	60	,	179	,	113],  //	mediumseagreen
	[	255	,	165	,		0],  //	orange
	[	255	,	192	,	203],  //	pink
	[	65	,	105	,	225],  //	royalblue
	[	102	,	205	,	170],  //	mediumaquamarine
	[	255	,	215	,		0],  //	gold
	[	178	,	34	,		34],  //	firebrick
	[	75	,		0	,	130],  //	indigo
	[	176	,	196	,	222],  //	lightsteelblue
	[	154	,	205	,		50],  //	yellowgreen
	[	255	,		0	,		0],  //	red
	[	230	,	230	,	250],  //	lavender
	[	95	,	158	,	160],  //	cadetblue
	[	245	,	222	,	179],  //	wheat
	[	255	,	20	,	147],  //	deeppink
	[		0	,		0	,	205],  //	mediumblue
	[	218	,	112	,	214],  //	orchid
	[		0	,	255	,	127],  //	springgreen
	[	128	,		0	,		0],  //	maroon
	[	255	,	105	,	180],  //	hotpink
	[		0	,	255	,	255],  //	cyan
	[	128	,	128	,		0],  //	olive
	[	210	,	105	,	30],  //	chocolate
	[	240	,	128	,	128],  //	lightcoral
	[	128	,	128	,	128],  //	gray
]



/*
* マイルストーンから日付リストを作成
*/
function getDateListFromMilestone(){

	var holidayList = [] //仮
	var dateList = []

	var milestoneStr = selectMilestone;
	var milestone =  searchElementSrtFromArray(milestoneList, "title", milestoneStr)
	var startDateStr = milestone.start_date;
	var dueDateStr   = milestone.due_date;

	var startDate = strToDate(startDateStr)
	var dateRange = dateDiff(startDateStr, dueDateStr) + 1　//初日を含むため+1する
	var tmpDate = startDate;

  for(var i = 0; i< dateRange; i++){

    var str = dateToStr(tmpDate)
		// if(tmpDate.getDay() != 0 && tmpDate.getDay() != 6 && holidayList.indexOf(str) == -1){
			dateList.push(str)
		// }
    tmpDate.setDate(tmpDate.getDate() + 1)
  }
	return dateList;
}



console.log("read completed main-chart-parson")
