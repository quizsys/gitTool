//グローバル変数の宣言
var burnDownChart
//
// /**
// * APIへのAjax通信用のメソッド
// * @param method : GET, POST
// * @param url : リクエスト先のURL
// * @param request : requestのjson
// * @param successFunc : リクエスト成功時に起動するfunction
// * @returns
// */
// function sendAjaxRequestToApi(method, url, request, successFunc){
//
//     //ajaxでservletにリクエストを送信
//     $.ajax({
//        type    : method,   //GET / POST
//        url     : API_URL + url,      //送信先のServlet URL（適当に変えて下さい）
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
//         alert("リクエスト時になんらかのエラーが発生しました：");
// 		 });
// }


/**
* 処理開始
*/
function getInfoBurnDownChart(){

		//入力チェック
		if(!labelIssueList){
      alert("マイルストーンが選択されていません\n「ISSUEを集計」の送信ボタンを押してください")
			return;
		}

    //初期化
    if(burnDownChart){
      burnDownChart.destroy()
    }

		//取得処理
		getBurnDownInfo()
}



/**
* バーンダウン情報を取得
*/
function getBurnDownInfo(){

    var milestone = selectMilestone;
    var label = document.getElementById("select-label").value;

    var successFunc = dataCreae
		var method = "GET";
		var url = "/burndown";
		var request = "milestone=" + encodeURIComponent(milestone) + "&label=" + encodeURIComponent(label)
		sendAjaxRequestToApi(method, url, request, successFunc)

}


/**
* グラフ表示用のデータを作成する
*/
function dataCreae(data){

  var todayDate = dateToStr(new Date());
  var label = document.getElementById("select-label").value;
  var milestoneStr = selectMilestone;

  //日付のリストを作成
  var dateList = []
  var milestone =  searchElementSrtFromArray(milestoneList, "title", milestoneStr)
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


  //取得データに最新のデータをマージ
  var d = labelIssueList[label]
  var todayData = {

    milestone: milestone.title,
    allIssueCount: d.issue_count,
    compIssueCount: d.comp_issue_count,
    date: todayDate,
    label: d.name,
    timeEstimate: d.time_estimate,
    totalTimeSpent: d.total_time_spent,
    totalTimeSpentMergeRequest:0
  }
  data.push(todayData)
  // console.log(data)

  //グラフ用のデータを準備
  var labels = []
  var compData = []
  var allData = []
  var compEstimate = []

  var initEstimateTime = 0
  var startDateData = searchElementSrtFromArray(data, "date", startDateStr);

  // 初回日にデータがある場合（初回日より後にラベルを追加した場合はデータがない）
  if(startDateData != null){
    initEstimateTime = searchElementSrtFromArray(data, "date", startDateStr).timeEstimate
  } else {
    console.log("★★★初日にデータがありません。後日ラベルが追加された可能性があります。★★★")
  }

  //見積もり時間が0でない場合
  if(initEstimateTime != 0){
    //初期データを投入
    labels.push("見積当初")
    compData.push(0)
    allData.push(initEstimateTime)
    compEstimate.push(initEstimateTime)
  }

  // 理想線のデータ作成
  var estimateTime = initEstimateTime
  var slope = estimateTime / dateList.length

  // 日付ごとにデータをマッピングしていく
  for(var i in dateList){

    // 日付に対応するデータを取得
    var d = searchElementSrtFromArray(data, "date", dateList[i])

    labels.push(dateList[i])

    if(d != null){
      compData.push(100 - round(100 * ((d.allIssueCount - d.compIssueCount) / d.allIssueCount), 0) )
      allData.push(d.timeEstimate - d.totalTimeSpent)
    }

    if(initEstimateTime != 0){
      //理想線のデータを追加
      estimateTime -= slope
      compEstimate.push(round(estimateTime, 0))
    }
  }

  console.log(labels)
  console.log(compData)
  console.log(allData)
  console.log(compEstimate)

  // グラフを描画
  chartCreateBurnDown(labels, compData, allData, compEstimate)

}


/*
* バーンダウンチャートを作成
*/
function chartCreateBurnDown(labels, compData, allData, compEstimate){

	//グラフ作成処理
	var ctx = document.getElementById("burnDownChart");
	burnDownChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: labels,
			datasets: [
				{
					label: '残作業量（実績）',
					data: allData,
					borderColor: "rgba(0,0,255,1)",
					backgroundColor: "rgba(0,0,0,0)",
					lineTension:0, //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる,
          yAxisID: "y-axis-1", // 追加
          type: 'line' // 追加
				},
				{
					label: '残作業量（理想）',
					data: compEstimate,
					borderColor: "gray",
					backgroundColor: "rgba(0,0,0,0)",
					lineTension:0, //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
          yAxisID: "y-axis-1", // 追加
          type: 'line' // 追加

				},
				{
					label: 'ISSUE完了率',
					data: compData,
          backgroundColor: "rgba(255,150,100,0.5)",
          borderColor:"rgba(255,0,0,0.8)",
          yAxisID: "y-axis-2" // 追加
				}
			],
		},
		options: optionBurnDown
	});
}


// グラフのオプション
var optionBurnDown = {
	title: {
		display: true,
		text: 'バーンダウンチャート',
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
							}
					}
			],
			yAxes: [                           // Ｙ軸設定
					{
            id: "y-axis-1",   // Y軸のID
            position: "left", // どちら側に表示される軸か？
						scaleLabel: {                  // 軸ラベル
								display: true,                 // 表示の有無
								labelString: '残作業量（時間）',     // ラベル
								fontSize: FONT_SIZE                   // フォントサイズ
						},
            ticks: {
              min: 0,             // 0から始める
            }
          },
          {
            id: "y-axis-2",   // Y軸のID
            position: "right", // どちら側に表示される軸か？
						scaleLabel: {                  // 軸ラベル
								display: true,                 // 表示の有無
								labelString: 'ISSUE完了率（%）',     // ラベル
								fontSize: FONT_SIZE                   // フォントサイズ
						},
            ticks: {
                // fontColor: "black",
                min: 0,             // 0から始める
                max: 100,                      // 最大値100
                autoSkip: true,                // 幅を小さくした場合に自動で表示数を減らす

              }
					}
			]
	}
}

// 
// /***********************************************************
// * 共通処理
// *************************************************************/
//
// /**
// * オブジェクトの配列から、キーが指定した値をオブジェクトを返却する
// */
// function searchElementSrtFromArray(array, key, searchStr){
//
//   var ret = null;
//   for(var i in array){
//       if(array[i][key] == searchStr){
//         ret = array[i];
//         break;
//       }
//   }
//   return ret;
// }
//
//
// /**
// * 日付の差分を計算
// * 例) 2020-01-01 と 2020-01-05 の差分 => 4
// */
// function dateDiff(dateStr1, dateStr2){
//
// 	var dateStr1Arr = dateStr1.split("-")
// 	var dateStr2Arr = dateStr2.split("-")
//
// 	var d1 = new Date(dateStr1Arr[0], dateStr1Arr[1]-1,dateStr1Arr[2])
// 	var d2 = new Date(dateStr2Arr[0], dateStr2Arr[1]-1,dateStr2Arr[2])
// 	return ((d2 - d1) / 86400000);
//
// }
//
//
// /**
// * 日付文字列をDate型で返す
// */
// function strToDate(dateStr){
//   var dateStrArr = dateStr.split("-")
//   return new Date(dateStrArr[0], dateStrArr[1]-1,dateStrArr[2])
//
// }
//
//
// /**
// * Date型オブジェクトを日付文字列（yyyy-MM-dd）で返す
// */
// function dateToStr(date){
//   return date.getFullYear() + "-" + ("00" + (date.getMonth() + 1)).slice(-2) + "-" + ("00" + date.getDate()).slice(-2)
// }


console.log("read completed main-chart")
