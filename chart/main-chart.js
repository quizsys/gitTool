const RELEASE_VERSION = "v5"   // このスクリプトのバージョン

//グローバル変数の宣言
var dateRange
var flagCount = 0
var list = {}
var closeList = {}
var dateList = [];
var milestoneList;
var milestoneNameList;
var labelSearchStr;
var burnDownChart
var burnUpChart

/**
* Ajax通信用のメソッド
* @param method : GET, POST
* @param url : リクエスト先のURL
* @param request : requestのjson
* @param successFunc : リクエスト成功時に起動するfunction
* @returns
*/
function sendAjaxRequest(method, url, request, successFunc, date){

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
      successFunc(data, date)
    })
    // 通信失敗時
		 .fail( function(data) {
        alert("リクエスト時になんらかのエラーが発生しました：");
		 });
}


/**
* 処理開始
*/
function getAll(){

		var startMileStoneNum = parseInt(document.getElementById("start-milestone").value)
		var endMileStoneNum   = parseInt(document.getElementById("end-milestone").value)
		var startMileStone = milestoneList[startMileStoneNum]
		var endMileStone   = milestoneList[endMileStoneNum]
		// console.log(startMileStoneNum, endMileStoneNum)
		// console.log(startMileStone, endMileStone)

		//入力チェック
		if(endMileStone.due_date <= startMileStone.due_date){
			alert("開始のマイルストーンは、終了のマイルストーンよりも前のものにしてください")
			return;
		}

		//グローバル変数を初期化
		milestoneNameList = []
		dateList = []
		list = {}
		closeList = {}
		flagCount = 0

		//期間を計算
		dateRange = endMileStone.id - startMileStone.id

		var searchLabelName = document.getElementById("label-name").value
		labelSearchStr = ""
		if(searchLabelName != ""){
			labelSearchStr = "&labels=" + searchLabelName
		}

		//格納
		for(var i = startMileStoneNum; endMileStoneNum<=i; i--){
			milestoneNameList[milestoneList[i].due_date] = milestoneList[i].title
			dateList.push(milestoneList[i].due_date)
		}

		//取得処理
		getIssuesList()
}


/**
* issueの統計情報を取得
*/
function getIssuesList(){

	for(var i in dateList){
		var startDate = dateList[i]
		var successFunc = function(data, date){
			list[date] = data.statistics.counts.all;
			closeList[date] = data.statistics.counts.closed;
			flagCheck()
		}
		var method = "GET";
		var url = "/groups/" + GROUP_ID + "/issues_statistics";
		var request = "private_token=" + TOKEN + "&created_before=" + startDate + "T23:59:59Z" + labelSearchStr;
		sendAjaxRequest(method, url, request, successFunc, startDate)
	}
}


//完了確認処理
function flagCheck(){
	flagCount++
	if(flagCount == dateRange+1){
		console.log(list)
		console.log(closeList)
		toggleChart()
	}
}

var optionBurnDown = {
	title: {
		display: true,
		text: 'バーンダウンチャート',
		fontSize: 28
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
							scaleLabel: {                  // 軸ラベル
									display: true,                 // 表示の有無
									labelString: 'ISSUEの数',     // ラベル
									fontSize: FONT_SIZE                   // フォントサイズ
							}
					}
			]
	}
}


var optionBurnUp = {
	title: {
		display: true,
		text: 'バーンアップチャート',
		fontSize: 28
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
							scaleLabel: {                  // 軸ラベル
									display: true,                 // 表示の有無
									labelString: 'ISSUEの数',     // ラベル
									fontSize: FONT_SIZE                   // フォントサイズ
							}
					}
			]
	}
}

/*
* チャートを作成
*/
function chartCreate(){

	//集計
	var labels = []
	var compData = []
	var allData = []
	var burnDownList = []

	for(var i in dateList){
		var date = dateList[i];
		labels.push(milestoneNameList[date])
		compData.push(closeList[date])
		allData.push(list[date])
		burnDownList.push(list[date]- closeList[date])
	}

	// console.log(labels)
	// console.log(compData)
	// console.log(allData)

	//グラフ作成処理（バーンアップ）
	var ctx = document.getElementById("burnUpChart");
	burnUpChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: labels,
			datasets: [
				{
					label: '全ISSUE',
					data: allData,
					borderColor: "rgba(255,0,0,1)",
					backgroundColor: "rgba(0,0,0,0)",
					lineTension:0 //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
				},
				{
					label: '完了したISSUE',
					data: compData,
					borderColor: "rgba(0,0,255,1)",
					backgroundColor: "rgba(0,0,0,0)",
					lineTension:0 //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
				}
			],
		},
		options: optionBurnUp
	});

	//グラフ作成処理（バーンダウン）
	var ctx2 = document.getElementById("burnDownChart");
	burnDownChart = new Chart(ctx2, {
		type: 'line',
		data: {
			labels: labels,
			datasets: [
				{
					label: 'openのISSUE',
					data: burnDownList,
					borderColor: "green",
					backgroundColor: "rgba(0,0,0,0)",
					lineTension:0 //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
				}
			]
		},
		options: optionBurnDown

	});
}


/*
* チャートを作成
*/
function chartCreate2(){

	//集計
	var labels = []
	var compData = []
	var allData = []
	var burnDownList = []

	for(var i in dateList){
		var date = dateList[i];
		labels.push(milestoneNameList[date])
		compData.push(closeList[date])
		allData.push(list[date])
		burnDownList.push(list[date]- closeList[date])
	}

	//予想線の数
	var estimateNum = parseInt(document.getElementById("estimateNum").value);

	//予想線を追加
	var tmpDate = dateList[dateList.length -1]
	var tmpMilestoneStr = milestoneNameList[tmpDate]
	var nextMilestoneNum = Number(tmpMilestoneStr.slice(MILESTONE_PREFIX.length))

	// console.log(nextMilestoneNum)

	//傾き
	var compSlope = avgArray(compData)
	var burnSlope = avgArray(burnDownList)

	// console.log(compSlope, burnSlope)

	//切片
	var compIntercept = compData[0]
	var burnIntercept = burnDownList[0]

	// 延長時の値
	var length = compData.length-1
	var compEndValue = compData[length]
	var allEndValue  = allData[length]
	var burnEndValue = burnDownList[length]

	// 既存の線を延長
	for(var i = nextMilestoneNum +1 ; i < nextMilestoneNum + estimateNum + 1; i++){
		// var milestoneNameStr = MILESTONE_PREFIX + ("000" + i).slice(0,4);
		var milestoneNameStr = MILESTONE_PREFIX + ("0000" + i).slice(-4);
		labels.push(milestoneNameStr)
		compData.push(compEndValue)
		allData.push(allEndValue)
		burnDownList.push(burnEndValue)
	}

	//予想線を作成
	var compEstimate = [];
	var burnEstimate = [];

	for(var i = 0 ; i < labels.length; i++){
		compEstimate.push(compIntercept + compSlope * i)
		burnEstimate.push(burnIntercept + burnSlope * i)
	}

		// console.log(labels)
		// console.log(compData)
		// console.log(allData)


	//グラフ作成処理（バーンアップ）
	var ctx = document.getElementById("burnUpChart");
	burnUpChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: labels,
			datasets: [
				{
					label: '全ISSUE',
					data: allData,
					borderColor: "rgba(255,0,0,1)",
					backgroundColor: "rgba(0,0,0,0)",
					lineTension:0 //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
				},
				{
					label: '完了したISSUE',
					data: compData,
					borderColor: "rgba(0,0,255,1)",
					backgroundColor: "rgba(0,0,0,0)",
					lineTension:0 //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
				},
				{
					label: '完了予想',
					data: compEstimate,
					borderColor: "gray",
					backgroundColor: "rgba(0,0,0,0)",
					lineTension:0 //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
				}
			],
		},
		options: optionBurnUp
	});

	//グラフ作成処理（バーンダウン）
	var ctx2 = document.getElementById("burnDownChart");
	burnDownChart = new Chart(ctx2, {
		type: 'line',
		data: {
			labels: labels,
			datasets: [
				{
					label: 'openのISSUE',
					data: burnDownList,
					borderColor: "green",
					backgroundColor: "rgba(0,0,0,0)",
					lineTension:0 //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
				},
				{
					label: '予想',
					data: burnEstimate,
					borderColor: "gray",
					backgroundColor: "rgba(0,0,0,0)",
					lineTension:0 //ベジェ曲線の張り具合。 0（ゼロ）を指定すると直線になる
				}
			]
		},
		options: optionBurnDown
	});
}

function toggleChart(){
	if(dateList.length == 0){
			return
	}

  //グラフを初期化
  if (burnDownChart) {
    burnDownChart.destroy();
  }
  if (burnUpChart) {
    burnUpChart.destroy();
  }

  //グラフを描画
	if(document.getElementById("estimateFlg").checked){
		chartCreate2()
	} else {
		chartCreate()
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
	var request = "private_token=" + TOKEN + "&per_page=100&search=" + MILESTONE_PREFIX ;
	sendAjaxRequest(method, url, request, successFunc)

}

/*
* マイルストーン一覧を設定
*/
function writeMilestoneList(data){

	console.log(data);
	milestoneList = data
	var html = "";
	for(var i in data){
		html += "<option value='" + i +"'>" + data[i].title + "</option>";
	}
	document.getElementById("start-milestone").innerHTML = html;
	document.getElementById("end-milestone").innerHTML = html;

	var initMilestoneNum = 4;
	if(milestoneList.length -1 < 4){
		initMilestoneNum = milestoneList.length -1;
	}
	document.getElementById("start-milestone").value = initMilestoneNum


}

/***********************************************************
* 共通処理
*************************************************************/
/*
* 配列の差分平均を計算
*/
function avgArray(array){
	var sum = 0
	for(var i =1; i<array.length; i++){
			sum += (array[i] - array[i-1]);
	}
	return round(sum / (array.length -1), 2);
}



/**
* 四捨五入する関数
* @number: 元の数字
* @n: 小数点第n位まで残す
*/
function round(number, n){
  return Math.floor( number * Math.pow( 10, n ) ) / Math.pow( 10, n ) ;
}


console.log("read completed")
console.log("RELEASE_VERSION:" + RELEASE_VERSION)
