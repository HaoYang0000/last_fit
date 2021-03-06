//var exerciseOverview = dc.barChart("#exercise_overview");
var weekdayView = dc.rowChart('#weekday_view');
var frequencyView = dc.pieChart('#frequency_view');
//var heatmapChart = dc.heatMap("#heatmap", "chartGroup");
var calendarChart = dc.calendarChart('#calendar_view');
var intradayView = dc.barChart('#intraday_activity');
//var width = document.getElementById('intraday_activity').offsetWidth;
var week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var parseDate = d3.time.format("%Y-%m-%d").parse;
var parseTime = d3.time.format("%H:%M:%S").parse;
var parseWhole = d3.time.format("%Y-%m-%dT%H:%M:%S").parse;
var activityLabels = ['Study', 'Walking', 'Lecture Time', 'Meeting', 'Running', 'Swimming', 'Walking the dog', 'Playing with children at the backyard'];
//var baseUrl = "http://localhost:8080/api";
var id = $("#identity").text();
var port = $("#portNo").text();
var env = $("#environment").text();

var host;
if (env == 'development') {
    host = `localhost` + `:${port}`;
}
if (env === 'production') {
    host = 'health-companion-uiuc.azurewebsites.net';
}
console.log(host);

var getStatUrl = `http://` + host + `/getactivity?userid=52KG66&daysBefore=4&today=2017-10-03`;
console.log(getStatUrl);
var data = d3.json(getStatUrl,
	function (error, dataArr) {
		//var sumTmp = 0;
		console.log(dataArr[0])

		var data = [];
		dataArr
			// data
			.forEach(function (x) {
				var tmpX = {};
				//tmpX.steps_value = +x[2];//				x.steps_value = +x.steps_value;
				//sumTmp += tmpX.steps_value;
				//tmpX.steps_all = sumTmp;
				tmpX.cals = +x[1];
				tmpX.wholeTime = parseWhole(x[0]);
				tmpX.date = (x[0].split('T')[0]);//ok without parseDate, if take intra-day view out
				tmpX.time = parseTime(x[0].split('T')[1]);//parseTime(x.time);
				tmpX.weekDay = parseDate(tmpX.date).getDay();//(new Date(tmpX.date)).getDay();
				var tmpD = new Date();
				tmpD.setDate(tmpD.getDate() - tmpD.getDay() + 1);
				tmpX.weekInMon = Math.ceil(tmpD.getDate()/7);
				data.push(tmpX);
			});
		var testDate = new Date();
		console.log(testDate, testDate.getDate(), ((testDate.getDate())/7))
		var exs = crossfilter(data);
		console.log(exs);
		var dateDim = exs.dimension(function (d) {
			return d.date;
		});
		var exercise_all = dateDim.group().reduceSum(function (d) {
			return d.cals;//d.steps_value;
		});
		var minDate = dateDim.bottom(1)[0].date;
		var maxDate = dateDim.top(1)[0].date;
  //  parseDate(maxDate).setDate(parseDate(maxDate).getDate() + 1);//otherwise cannot show the last date
  //  console.log(maxDate);


		var exerciseCount = dc.dataCount('#dc-data-count');
		// var ndx = crossfilter(data);
		var all = exs.groupAll();

		exerciseCount
			.dimension(exs)
			.group(all)
			.html({
				some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
					' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'>Reset All</a>',
				all: 'All records selected. Please click on the graph to apply filters.'
			});

		var calendarDimension = exs.dimension(function (d) {
        //("%Y-%m-%d")
        return d.date;
    });

		console.log(calendarDimension.bottom(1)[0].date)

		var calendarGroup = calendarDimension.group().reduce(
			(p,v)=>{
				//p.stepAll += v.steps_value;
				p.calAll += v.cals;
				return p;
			},
			(p,v)=>{
				//p.stepAll -= v.steps_value;
				p.calAll -= v.cals;
				return p;
			},
			()=>{
				return {calAll:0};
			}
		);
		/*Sum((d)=>{
			return d.steps_value;
		});*/
		calendarChart.addFilterHandler(function (filters, filter) {
		    filters.length = 0; // empty the array
		    filters.push(filter);
		    return filters;
		});//to make sure that only one day is selected
		calendarChart.width(900)
        .height(130)
        .dimension(calendarDimension)
        .group(calendarGroup)
        .valueAccessor(function (p) {
            return p[0].value.calAll.toFixed(3);
        })
        .viewMode('week')
        .currSelectedDate('2017-10-02')
        .renderTitle(true).filter(maxDate);

		//mothChart,week,
		//$(#)/.empty

		var generateLabels = function (user_id) {
			console.log(user_id,'label generating');
			$('#labels').empty();//
			$('#addLabel').empty();
        $.get(`http://` + host + `/getLabel`, {'user_id': user_id}, function (data) {
				//console.log(data[0]);
				//console.log(data.length);
				for (item in data) {
					var labelInfo = data[item];
					//TODO a brief version, only show labelInfo[2][0], not concatened labelInfo[2] items
					labelName = JSON.parse(labelInfo[2])[0];
					subjFeel = JSON.parse(labelInfo[5])[0];
          shortenedCal = (+labelInfo[4]).toFixed(3);
					$('#labels').append("<button class='btn btn-primary life-label' style='margin:5px;'>"
					 + `${labelName},\nconsuming around ${shortenedCal} calorie,\n feeling ${subjFeel}` + "</button>");
				}
			});


			$('#addLabel').append("<input type='text' id='newLabel' placeholder='Walking to Siebel' style='margin:5px;'></input>");
			$('#addLabel').append("<input type='text' id='subjTag' placeholder='refreshing' style='margin:5px;'> </input> ");
			$('#addLabel').append("<input type='button' class='btn' id='submitLabel' value='Submit New Label'></input>");
			/*for (item in activityLabels) {
				$('#labels').append("<button class='btn btn-primary life-label' style='margin:5px;'>" + activityLabels[item] + "</button>");
			}*/
		}

		var uploadLabel = function (user_id, periodStart, periodEnd, labelName, duration, accumSteps, accumCals, subjTag) {
			var label = {
				'user_id': user_id,
				'labelName': labelName,
				'periodStart': periodStart,
				'periodEnd': periodEnd,
				'duration': duration,
				'steps': accumSteps,
				'cals':accumCals,
				'subjTag':subjTag
			}

     $.post(`http://` + host + `/insertLabel`, label, function (data) {
				//console.log(data);
				generateLabels(user_id);
				//console.log(data.duration);
			});
		}


		var weekDayDim = exs.dimension(function (d) {
			return 'day' + '.' + week[d.weekDay];
		});
		var weekDayGroup = weekDayDim.group().reduceSum(function (d) {
			return d.cals;
		});

		weekdayView
			//.width(width).height(300)
			.height(300)
			.dimension(weekDayDim)
			.group(weekDayGroup)
			.elasticX(true)
			.label(function (d) {
				return d.key.split('.')[1];
			})
			.xAxis()
			.ticks(4);

		var exerciseDim = exs.dimension(function (d) {
			return d.cals;
		});
		var exerciseGroup = exerciseDim.group(function (d) {
			return Math.floor(d / 3000) * 3000;
		}).reduceCount();
		// var minExercise = exerciseDim.bottom(1)[0].steps_all;
		// var maxExercise = exerciseDim.top(1)[0].steps_all;

		frequencyView
			//.width(width)
			.height(400)
			.dimension(exerciseDim)
			.group(exerciseGroup)
			.innerRadius(100)
			.legend(dc.legend());

		var intradayDim = exs.dimension(function (d) {
			return d.time;
		});

    console.log(intradayDim);
		// var aggre_value = 0;

		var intradayGroup = intradayDim.group().reduceSum(function (d) {
			// aggre_value = aggre_value + d.steps_value;
			return d.cals;
		});
		var start_time = intradayDim.bottom(1)[0].time;

		var end_time = intradayDim.top(1)[0].time;


		intradayView
			.dimension(intradayDim)
			.group(intradayGroup)
			.xAxisLabel("Intraday activities")
			.elasticY(true)
			.elasticX(true)//must have, otherwise no intra curve
			.brushOn(true)
			.x(d3.time.scale().domain(['00:00:00', '23:59:59']))
			.on('renderlet', function (chart) {

				generateLabels(id);

				//console.log(chart.brush().extent());

				var p_start_time = new Date(intradayDim.bottom(1)[0].time);
				var p_end_time = new Date(intradayDim.top(1)[0].time);
				p_end_time.setMinutes(p_end_time.getMinutes() + 1);

				console.log('brush selecte time period:', p_start_time, ', ', p_end_time);
				var selectedDate = new Date(dateDim.top(1)[0].date);

			//add this line would eat some data
				var accumSteps = intradayDim.filter([p_start_time, p_end_time]).top(Infinity)//.groupAll()
				.reduce(function(prev, curr) {
					return prev+(curr.cals);
				}, 0);//Sum((d)=>{return d.steps_value;});
				console.log(accumSteps);

			var accumCals = intradayDim.filter([p_start_time, p_end_time]).top(Infinity)
				.reduce(function(prev, curr) {
					return prev + (curr.cals);
				}, 0);
				console.log(accumCals);

				intradayDim.filterAll();//must add this!the above 2 lines influence the filter itself! use console.log(intradayDim.top(Infinity)) to test

				var periodStart = new Date(selectedDate);
				//console.log(periodStart.toISOString(),p_start_time.toISOString(),p_start_time.toLocaleTimeString());
				periodStart.setHours(p_start_time.getHours());
				periodStart.setMinutes(p_start_time.getMinutes());
				periodStart.setSeconds(p_start_time.getSeconds());

				var periodEnd = new Date(selectedDate);
				//periodEnd.setDate(selectedDate.getDate());
				periodEnd.setHours(p_end_time.getHours());
				periodEnd.setMinutes(p_end_time.getMinutes());
				periodEnd.setSeconds(p_end_time.getSeconds());
		//		var periodEnd = end_time.toLocaleTimeString();
				console.log('from ', p_start_time, 'to ', p_end_time);
				var duration = Math.round((p_end_time - p_start_time)/(1000*60));

				$('#submitLabel').on('click', function () {
					if ($('#newLabel').val().match(/\S/) && periodStart !== "06:00:00 AM" && periodEnd !== "10:00:00 PM") {
						activityLabels.push($('#newLabel').val());
						//TODO don't display at once. how to use promise with ajax post?

						uploadLabel(id, periodStart, periodEnd, $('#newLabel').val(), duration, accumSteps, accumCals, $('#subjTag').val());
					} else {
						alert("Please type in the activity before hit the submit button!");
					}
				});

				$('.life-label').on('click', function (d) {

					if (d.target.innerText.match(/\S/) && periodStart !== "06:00:00 AM" && periodEnd !== "10:00:00 PM") {

						uploadLabel(id, d.target.innerText, periodStart, periodEnd, duration, accumSteps);


					} else {
						alert("Please select the time interval before hit the activity!");
					}

					// Add listener to object?
					// var plan = '<p class="tasks">' + d.target.innerText + '&nbsp;&nbsp;From: ' + intradayDim.bottom(1)[0].time.toLocaleTimeString(navigator.language, {
					// 		hour: '2-digit',
					// 		minute: '2-digit'
					// 	})
					// 	.replace(/(:\d{2}| [AP]M)$/, "") + '&nbsp;&nbsp;To: ' + intradayDim.top(1)[0].time.toLocaleTimeString(navigator.language, {
					// 		hour: '2-digit',
					// 		minute: '2-digit'
					// 	})
					// 	.replace(/(:\d{2}| [AP]M)$/, "") + '</p>'
					// $('#taskPlan').append(plan);
					// console.log(d.target.innerText);
					// console.log(plan);
				});

			});


		dc.renderAll()

	});
