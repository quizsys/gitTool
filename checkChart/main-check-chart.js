//グローバル変数の宣言
var chart
var grobal_project_id
var grobal_iid
var all_task_count
var grobal_issue_title
var discussionArray = []

/**
* 処理開始
*/
function getInfoCheck(){

	// URLを取得
	var url = new URL(window.location.href);

	// URLSearchParamsオブジェクトを取得
	var params = url.searchParams;

		//パラメータ取得
		var iid = params.get('iid')
		var project_id = params.get('project_id')

		//入力チェック
		if(iid == undefined || project_id == undefined){
			alert("パラメータが選択されていません\n「?project_id=X&iid=Y」を指定してください(ERR02)")
			return;
		}

		grobal_project_id = project_id
		grobal_iid = iid

    //初期化
    if(chart){
      chart.destroy()
    }

		//取得処理
		getIssueInfo()
}



/**
* ISSSUE情報を取得
*/
function getIssueInfo(){

	var method = "GET";
  var successFunc = writeIssueResult;
  var url = "/projects/" + grobal_project_id + "/issues/" + grobal_iid;
  var request = "private_token=" + TOKEN // + "&per_page=100" + "&page=" + issuePage;
  sendAjaxRequest(method, url, request, successFunc)

}


/**
* 取得結果の格納
*/
function writeIssueResult(data){

	console.log(data)

	if(!data.has_tasks){
		alert("ISSUEにチェックボックスがありません(ERR03)")
		return false;
	}

	// 全件を保存
	all_task_count = data.task_completion_status.count
	grobal_issue_title = data.title

	//カウント用
	issuePage = 1
	discussionArray = []

	getIssueInfoCheck()
}


/**
* ISSSUE情報を取得
*/
function getIssueInfoCheck(){

	var method = "GET";
  var successFunc = writeInfoCheck;
  var url = "/projects/" + grobal_project_id + "/issues/" + grobal_iid + "/discussions";
  var request = "private_token=" + TOKEN + "&per_page=100" + "&page=" + issuePage;
  sendAjaxRequest(method, url, request, successFunc)

}

/**
* 結果チェック
*/
function writeInfoCheck(data){

		console.log(data)

	for(var i in data){
		var d = data[i].notes[0]
			// console.log(d.body.indexOf("marked the task"))
			// 	console.log(d.body)
		if(d.system && d.body.indexOf("marked the task") > -1){
				checkBoxCheck(d)
		}
	}

	if(data.length == 100){
		console.log("ISSUE_DISCUSSIONが100件を超えました。ページ番号=" + issuePage)
		issuePage++
		getIssueInfoCheck();
		return
	}

	writeResult()
}

/**
* チェックボックスのチェックオン、チェックオフを判定し、配列に格納する
*/
function checkBoxCheck(d){

	var dArr = d.body.split("**")
	var ret = {}

	if(dArr[2] == " as completed"){
		ret.comp = true
		ret.validFlg = true //有効無効フラグ（trueなら有効データ）

	} else if(dArr[2] == " as incomplete"){
		ret.comp = false
		ret.validFlg = false //有効無効フラグ（trueなら有効データ）

	} else {
		console.log("想定外のエラーです")
		return
	}

	ret.title = dArr[1]
	ret.created_at = d.created_at.slice(0,10) //年月日のみにする
	discussionArray.push(ret)

}


/**
* 結果の書き出し
*/
function writeResult(){
	console.log(discussionArray)

	// incompleteの判定
	for(var i in discussionArray){

		//incompleteのデータの場合
		if(!discussionArray[i].comp){
			var title = discussionArray[i].title

			//有効データの中でチェックの外れたものを無効化
			for(var j in discussionArray){
				if(discussionArray[j].title == title){
					discussionArray[j].validFlg = false
				}
			}
		}
	}

	var startDate = "2999-12-31"
	var endDate   = "2000-01-01"

	//開始・終了日を取得
	for(var i in discussionArray){

		//有効フラグ判定
		if(!discussionArray[i].validFlg){
			continue;
		}

		var created_at = discussionArray[i].created_at
		if(dateDiff(startDate, created_at) < 0){
			startDate = created_at
		}

		if(dateDiff(endDate, created_at) > 0){
			endDate = created_at
		}
	}

	var dateRange = dateDiff(startDate, endDate)

		// console.log(startDate)
		// console.log(endDate)
		// console.log(dateRange)


	var dateList = []
	var holidayList = []

	//日付リストを作成
	var tmpDate = strToDate(startDate);
  for(var i = 0; i< dateRange; i++){
    var str = dateToStr(tmpDate)
		if(tmpDate.getDay() != 0 && tmpDate.getDay() != 6 && holidayList.indexOf(str) == -1){
			dateList.push(str)
		}
    tmpDate.setDate(tmpDate.getDate() + 1)
  }


	var resultList = {}

	//集計
	for(var i in discussionArray){

		//有効フラグ判定
		if(!discussionArray[i].validFlg){
			continue;
		}

		var created_at = discussionArray[i].created_at
		if(!resultList[created_at]){
			resultList[created_at] = 0
		}
		resultList[created_at] ++
	}


	var resultList2 = {}
	var restTaskCount = all_task_count

	for(var i in resultList){
		restTaskCount -= resultList[i]
		resultList2[i] = restTaskCount
	}


	var labels = []
	var allData = []

	labels[0] = "初期値"
	allData[0] = all_task_count


	for(var i in resultList2){

		labels.push(i)
		allData.push(resultList2[i])

	}

		console.log(labels)
		console.log(allData)
		chartCreate(labels, allData)


}



/*
* チャートを作成
*/
function chartCreate(labels, allData){

	//グラフ作成処理
	var ctx = document.getElementById("chart");
	chart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: labels,
			datasets: [
				{
					label: '残タスク数',
					data: allData,
					borderColor: "rgba(0,0,255,1)",
					backgroundColor: "rgba(0,0,0,0)",
					lineTension:0, //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる,
          yAxisID: "y-axis-1", // 追加
					pointBorderWidth: 10,
					borderWidth:5,
          type: 'line' // 追加
				}
			],
		},
		options: option
	});
}


// グラフのオプション
var option = {
	title: {
		display: true,
		text: 'チャート',
		fontSize: 28,
    responsive: true,
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
						scaleLabel: {                  // 軸ラベル
								display: true,                 // 表示の有無
								labelString: '残タスク数',     // ラベル
								fontSize: FONT_SIZE                   // フォントサイズ
						},
            ticks: {
              min: 0,             // 0から始める
							// max: 13,           // 最大値
							autoSkip: true,                // 幅を小さくした場合に自動で表示数を減らす
							maxTicksLimit:10,
							fontSize: FONT_SIZE                   // フォントサイズ


            }
          },
			]
	}
}


console.log("read completed main-chart")
