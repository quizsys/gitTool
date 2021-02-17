//グローバル変数の宣言
var burnDownChart

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

    var milestoneStr = selectMilestone;
		var milestone =  searchElementSrtFromArray(milestoneList, "title", milestoneStr)
    var label = document.getElementById("select-label-chart").value;
		var startDate = milestone.start_date;
		var endDate   = milestone.due_date;

    var successFunc = dataCreae
		var method = "GET";
		var url = "/burndown";
		var request = "milestone=" + encodeURIComponent(milestoneStr) + "&label=" + encodeURIComponent(label) + "&startDate=" + encodeURIComponent(startDate) + "&endDate=" + encodeURIComponent(endDate);
		sendAjaxRequestToApi(method, url, request, successFunc)

}


/**
* グラフ表示用のデータを作成する
*/
function dataCreae(burndownReturn){

	// 取得情報を格納
	var data = burndownReturn.burnDownList
	var holidayList = burndownReturn.holidayList

  var todayDate = dateToStr(new Date());
  var label = document.getElementById("select-label-chart").value;
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

		if(tmpDate.getDay() != 0 && tmpDate.getDay() != 6 && holidayList.indexOf(str) == -1){
			dateList.push(str)
		}
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
		compTimeEstimate: d.comp_time_estimate,
		uncompTimeSpent: d.uncomp_time_spent,
    // totalTimeSpent: d.total_time_spent,
    totalTimeSpentMergeRequest:0
  }
  data.push(todayData)
  console.log(data)

  //グラフ用のデータを準備
  var labels = []
  var issueCount = []
  var allData = []
  var compEstimate = []
	var compIssueCount = []

  var initEstimateTime = 0
	var initIssueCount = 0
  var startDateData = searchElementSrtFromArray(data, "date", startDateStr);

  // 初回日にデータがある場合（初回日より後にラベルを追加した場合はデータがない）
  if(startDateData != null){
    initEstimateTime = searchElementSrtFromArray(data, "date", startDateStr).timeEstimate
		initIssueCount   = searchElementSrtFromArray(data, "date", startDateStr).allIssueCount
  } else {
    console.log("★★★初日にデータがありません。後日ラベルが追加された可能性があります。★★★")
  }

  //見積もり時間が0でない場合
  if(initEstimateTime != 0){
    //初期データを投入
    labels.push("見積当初")
    issueCount.push(initIssueCount)
    allData.push(round(initEstimateTime /3600, 2))
    compEstimate.push(round(initEstimateTime /3600, 2))
		compIssueCount.push(0)
  }

  // 理想線のデータ作成
  var estimateTime = initEstimateTime
	var bussinessCount = dateList.length
  var slope = estimateTime / bussinessCount

  // 日付ごとにデータをマッピングしていく
  for(var i in dateList){

    // 日付に対応するデータを取得
    var d = searchElementSrtFromArray(data, "date", dateList[i])

    labels.push(dateList[i])

    if(d != null){
			// allData.push(ceil((d.timeEstimate - d.compTimeEstimate) / 3600, 2))
			allData.push(ceil((d.timeEstimate - d.compTimeEstimate - d.uncompTimeSpent) / 3600, 2))
      issueCount.push(d.allIssueCount - d.compIssueCount)
			compIssueCount.push(d.compIssueCount)
    }

		//理想線のデータを追加
    if(initEstimateTime != 0){
			estimateTime -= slope
      compEstimate.push(ceil(estimateTime/3600, 2));
    }
  }

  console.log(labels)
  console.log(issueCount)
  console.log(allData)
  console.log(compEstimate)
  console.log(compIssueCount)

  // グラフを描画
  chartCreateBurnDown(labels, issueCount, allData, compEstimate, compIssueCount)

}


/*
* バーンダウンチャートを作成
*/
function chartCreateBurnDown(labels, issueCount, allData, compEstimate, compIssueCount){

	//グラフの最大値を設定
	// optionBurnDown.scales.yAxes[0].ticks.max = calcRoundMax(allData)


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
					pointBorderWidth: 10,
					borderWidth:5,
          type: 'line' // 追加
				},
				{
					label: '残作業量（理想）',
					data: compEstimate,
					borderColor: "rgba(60,60,60,1)",
					backgroundColor: "rgba(0,0,0,0)",
					lineTension:0, //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
          yAxisID: "y-axis-1", // 追加
					pointBorderWidth: 10,
					borderWidth:5,
          type: 'line' // 追加

				},
				{
					label: '完了ISSUE',
					data: compIssueCount,
          // backgroundColor: "rgba(255,150,100,0.6)",
          // borderColor:"rgba(255,0,0,0.8)",
					backgroundColor: "rgba(0,100,0,0.5)",
					stack: 'Stack 0',
          yAxisID: "y-axis-2" // 追加
				},
				{
					label: '未完了ISSUE',
					data: issueCount,
          // backgroundColor: "rgba(255,150,100,0.1)",
          // borderColor:"rgba(255,0,0,0.2)",
					backgroundColor: "rgba(0,100,0,0.15)",
					stack: 'Stack 0',
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
								labelString: '残作業量（時間）',     // ラベル
								fontSize: FONT_SIZE                   // フォントサイズ
						},
            ticks: {
              // min: 0,             // 0から始める
							// max: 13,           // 最大値
							autoSkip: true,                // 幅を小さくした場合に自動で表示数を減らす
							maxTicksLimit:10,
							fontSize: FONT_SIZE                   // フォントサイズ


            }
          },
          {
            id: "y-axis-2",   // Y軸のID
            position: "right", // どちら側に表示される軸か？
						stacked: true,
						scaleLabel: {                  // 軸ラベル
								display: true,                 // 表示の有無
								labelString: 'ISSUE件数',     // ラベル
								fontSize: FONT_SIZE                   // フォントサイズ
						},
            ticks: {
                // fontColor: "black",
                min: 0,             // 0から始める
                // max: 100,                      // 最大値100
                autoSkip: true,                // 幅を小さくした場合に自動で表示数を減らす
								maxTicksLimit:10,
								fontSize: FONT_SIZE                   // フォントサイズ


              }
					}
			]
	}
}

/**
* 配列の中の最大値 + 10の値を適切な桁数にして返す
*/
/*
function calcRoundMax(arr){

	//配列0の場合計算できないので、0を返す
	if(arr.length == 0){
		return 0
	}

	var max = Math.max(...arr)

	// 最大値が0の場合計算できないので、0を返す
	if(max == 0){
		return 0
	}

	//10%追加する
	var nextMax = max * 1.1

	var ret = nextMax

	if(nextMax > 1000){
		// 100 の倍数に丸め込む
		// 例：　1230 → 1200
		ret = Math.round((nextMax /100), 2) * 100

	} else if(nextMax > 500){
		// 50 の倍数に丸め込む
		// 例：　224 → 200
		ret = Math.round((nextMax /50), 1) * 50

	} else if(nextMax > 200){
		// 20 の倍数に丸め込む
		// 例：　123 → 120
		ret = Math.round((nextMax /20), 1) * 20

	} else if(nextMax > 100){
		// 10 の倍数に丸め込む
		// 例：　123 → 120
		ret = Math.round(( nextMax/10), 1) * 10

		} else if(nextMax > 50){
			// 5 の倍数に丸め込む
			// 例：　72 → 70
			ret = Math.round((nextMax /5), 1) * 5

		} else if(nextMax > 20){
			// 2 の倍数に丸め込む
			// 例：　21 → 20
			ret = Math.round((nextMax /2), 1) * 2
		}
		return ret;

}
*/

console.log("read completed main-chart")
