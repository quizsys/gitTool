
/**
* 処理開始
*/
function getInfoParsonChartEstimate(userId){

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
		selectUserId = userId
		//取得処理
		dataCreaetEstimate(userId)
}



/**
* グラフ表示用のデータを作成する
*/
function dataCreaetEstimate(userId){

  var labels = []
	var dataList = []

  // issueの一覧から該当ユーザの情報のみ取得
  for(var i in issueList){
    if(issueList[i].assignee.id == userId && issueList[i].time_stats.time_estimate > 0){
      var project_id = issueList[i].project_id
      if(!labels[project_id]){
        labels[project_id] = projectList[project_id].name
        dataList[project_id] = 0
      }
      dataList[project_id] += issueList[i].time_stats.time_estimate
    }
  }

  for(var i in dataList){
    dataList[project_id] = round((dataList[project_id] / 3600) , 2)
  }
  // グラフを描画
  createPasonIssueChartEstimate(labels, dataList)

}


// function hoge(){
// 	var labels = ["test1", "test2", "test3","test1", "test2", "test3","test1", "test2", "test3","test1", "test2", "test3"]
// 	var dataList = [10, 20, 30,10, 20, 30,10, 20, 30,10, 20, 30]
//
// 	createPasonIssueChartEstimate(labels, dataList, labels, colorList)
// }


/*
* チャートを作成
*/
function createPasonIssueChartEstimate(labels, dataList){

	var title = "プロジェクト別時間(" + userList[selectUserId] + ")"

    console.log(labels)
      console.log(dataList)

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
										labelString: 'Estimate Time(h)',    // ラベル
										fontSize: FONT_SIZE                   // フォントサイズ
								},
								ticks: {
									beginAtZero:!0,
									fontSize: FONT_SIZE                   // フォントサイズ
								}
						}
				],
				yAxes: [                           // Ｙ軸設定
						{
							scaleLabel: {                  // 軸ラベル
									display: true,                 // 表示の有無
									labelString: 'プロジェクト',     // ラベル
									fontSize: FONT_SIZE                   // フォントサイズ
							},
	            ticks: {
								autoSkip: true,                // 幅を小さくした場合に自動で表示数を減らす
								fontSize: FONT_SIZE                   // フォントサイズ
	            }
	          }
				]
		}
	}

	var opacity = 0.6
	var colorList = []

	for(var i in dataList){
		var color = selectColor(i)
		var bgColor = "rgba(" + color[0] + "," + color[1]  + "," + color[2] + "," + opacity + ")"
		colorList[i] = bgColor
	}


	var chartData =  {
		type: 'horizontalBar',
		data: {
			labels: labels,
			datasets: [{
				data:dataList,
				backgroundColor:colorList
			}],
		},
		options: pasonIssueChartOption,
	}

  console.log(chartData)


	//グラフ作成処理
	var ctx = document.getElementById("pasonIssueChart");
	parsonChart = new Chart(ctx,chartData);
	// ctx = document.getElementById("pasonIssueChart");
	// console.log(ctx.style.width)
	// console.log(ctx.style.height)
  //
	// var width = Number.parseInt(ctx.style.width.replace("px", ""))
	// var height = Number.parseInt(ctx.style.height.replace("px", ""))
  //
	// ctx.style.width = (width * 0.8) + "px"
	// ctx.style.height = (height * 0.8) + "px"
	// ctx.style.marginLeft =  (width * 0.1) + "px"
}

console.log("read completed main-chart-parson-estimate")
