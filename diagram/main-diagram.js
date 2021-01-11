const RELEASE_VERSION = "v1"

/***********************************************************
* 情報取得処理
*************************************************************/

/**
* ISSUEを取得する
*/
function getIssues(){

	var startDateStr = document.getElementById("start-date").value;
	var endDateStr   = document.getElementById("end-date").value;

	var today = getDateStr(0)

	//終了日は、今日以前の日付でない場合
	if(dateDiff(today, endDateStr) > 0){
		alert("終了日は今日以前の日付にしてください")
		return false;
	}

	//開始日が終了日よりも前ではない場合
	if(dateDiff(startDateStr, endDateStr) < 1){
		alert("開始日は終了日よりも前の日付にしてください")
		return false;
	}

    var method = "GET";
    var successFunc = dataSet;
    var url = "/api";
    var request = "startDateStr=" + startDateStr + "&endDateStr=" + endDateStr;
    sendAjaxRequestToApi(method, url, request, successFunc)
}


/*
* データを配列にセットし、グラフを表示する
*/
function dataSet(data){

	console.log(data)

	var dateList = [];
	var openedList = [];
	var todoList = [];
	var doingList = [];
	var doneList = [];
	var closedList = [];

	for(var i in data){
		var d = data[i];
		dateList.push(d.date)
		openedList.push(d.opened)
		todoList.push(d.todo)
		doingList.push(d.doing)
		doneList.push(d.done)
		closedList.push(d.closed)

	}


	//グラフ作成処理（バーンアップ）
	var ctx = document.getElementById("chart");
	var myLineChart = new Chart(ctx, {
	  type: 'line',
	  data: {
	    labels: dateList,
	    datasets: [
	      {
	        label: 'closed',
	        data: closedList,
	        borderColor: "rgba(254,55,148,1)",
	        backgroundColor: "rgba(254,55,148,0.5)",
	        lineTension:0, //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
			//fill: '1'
	      },
	      {
	        label: 'done',
	        data: doneList,
	        borderColor: "rgba(133,73,186,1)",
	        backgroundColor: "rgba(133,73,186,0.5)",
	        lineTension:0, //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
			fill: '-1'
	      },

	      {
	        label: 'doing',
	        data: doingList,
	        borderColor: "rgba(0,169,80,1)",
	        backgroundColor: "rgba(0,169,80,0.5)",
	        lineTension:0, //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
			fill: '-1'
	      },

	      {
	        label: 'todo',
	        data: todoList,
	        borderColor: "rgba(246,112,25,1)",
	        backgroundColor: "rgba(246,112,25,0.5)",
	        lineTension:0, //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
			fill: '-1'
	      },

	      {
	        label: 'opened',
	        data: openedList,
	        borderColor: "rgba(77,201,246,1)",
	        backgroundColor: "rgba(77,201,246,0.5)",
	        lineTension:0, //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
			fill: '-1'
	      }
	    ],
	  },
	  options: {

	    title: {
	      display: true,
	      text: '累積フロー図',
	      fontSize: 28
	    },
	    scales: {
	      yAxes: [{
              stacked: true,
              scaleLabel: {                 // 軸ラベル
                  display: true,                // 表示設定
                  labelString: 'ISSUEの数',    // ラベル
                  fontSize: FONT_SIZE       // フォントサイズ
              }
	      }],
	      xAxes: [{
              scaleLabel: {                 // 軸ラベル
                  display: true,                // 表示設定
                  labelString: '日付',    // ラベル
                  fontSize: FONT_SIZE       // フォントサイズ
              }
	      }]
	    },

		plugins: {
			filler: {
				propagate: true //他のグラフに重ならないように、下を埋めないように設定
			},
			'samples-filler-analyser': {
				target: 'chart-analyser'
			}
		}
	  }
	});
}

/***********************************************************
* 初期化処理
*************************************************************/
/*
* 日付の初期値を設定
*/
function initDate(){

	document.getElementById("start-date").value = getDateStr(30);
	document.getElementById("end-date").value   = getDateStr(0);
}

/***********************************************************
* 共通処理
*************************************************************/

console.log("read completed")
console.log("RELEASE_VERSION:" + RELEASE_VERSION)
