//TODO
//Deactivating/TOS is a resolution 



Logger.clear();
Logger.clear();
var ssMaster = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1t8-D-SWfitVeDc3hrfBlMhIZ4HYnjnSWaE68VCKDN1c/edit');
var resourcesSheet = ssMaster.getSheetByName('Resources');
var paramsSheet = ssMaster.getSheetByName('Params');

var leaksSheet = ssMaster.getSheetByName('Leakers');

var repairSheet = getSheet("Repairs", "Sheet1");

var newCompsSheet = getSheet("Activated Components", "Sheet1");

var techsSheet = ssMaster.getSheetByName('techs');
var functionSheet = ssMaster.getSheetByName('functionsCompleted');

//input Setup


//Units Sheets
var inspUnitCol = 1;
var inspCompTagCol = 2;
var inspTestTypeCol = 4;
var inspDateCol = 5;
var inspPPMcol = 6;
var inspPassFailCol = 7;
var inspTechCol = 8;

//repair Sheets
var repInspectionDateCol = 7;
var techList = [];

//output Setup
var failures = [
	["nan", "", "", "", "", "", "", ""]
];


//variable Setup
var leakDef = fetchValue(paramsSheet, 1, 2, 'Leak Definition');

var r = 0;
var activeRow = [
	[]
];
addSpacesToArray();


function master() {
	//loopThruUnits(99);
	//var noOfRows = activeRow.length;
	//var noOfCols = activeRow[0].length;
	//leaksSheet.getRange(2, 1, noOfRows, noOfCols).setValues(activeRow);

	findFirstAttempt(setupRepairs());
	colLabels();


	//need to format columns
	SpreadsheetApp.getActiveSpreadsheet().toast('Done', 'Status', -1);

}

function setFilter() {

	var filterSettings = {};

	// The range of data on which you want to apply the filter.
	// optional arguments: startRowIndex, startColumnIndex, endRowIndex, endColumnIndex
	filterSettings.range = {
		sheetId: ssMaster.getSheetByName('Leakers').getSheetId()
	};

	// Criteria for showing/hiding rows in a filter
	// https://developers.google.com/sheets/api/reference/rest/v4/FilterCriteria
	filterSettings.criteria = {};
	var columnIndex = 5;
	filterSettings['criteria'][columnIndex] = {
		'hiddenValues': [""]
	};

	var request = {
		"setBasicFilter": {
			"filter": filterSettings
		}
	};
	Sheets.Spreadsheets.batchUpdate({
		'requests': [request]
	}, ssMaster.getId());
}

//MAke this work
function clearFilter() {
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var ssId = ss.getId();
	var sheetId = ss.getActiveSheet().getSheetId();
	var requests = [{
		"clearBasicFilter": {
			"sheetId": sheetId
		}
	}];
	Sheets.Spreadsheets.batchUpdate({
		'requests': requests
	}, ssId);
}

function findFirstAttempt(repairArray) {

	SpreadsheetApp.getActiveSpreadsheet().toast(' working.... ', 'Finding first Attempts', -1);
	var lastRowLeaks = leaksSheet.getLastRow();
	var lastRowRepairs = repairSheet.getLastRow();
	var leakRange = leaksSheet.getRange(1, 1, lastRowLeaks, 19)
	var leakArray = leakRange.getValues();

	for (j = 0; j < lastRowLeaks; j++) {
		var currentStatus = leakArray[j][5];

		if (currentStatus == 'newleak') {
			var currentTag = leakArray[j][0];
			var currentTime = leakArray[j][1];

			//cycle though attempts
			for (k = lastRowRepairs - 1; k >= 0; k--) {

				var eventTag = repairArray[k][0];
				var eventName = repairArray[k][2];
				var eventDate = repairArray[k][3];
				//if(eventTag == currentTag && eventDate >= currentTime && eventName=="Repair Attempt" || eventName=="Repair Attempt" ){
				if (eventTag == currentTag && eventDate >= currentTime) {
					leaksSheet.getRange(j + 1, 5).setValue(eventDate);
					calcDaystoFirstAttempt(currentTime, eventDate, j + 1, 7);
					k = 1;
				}
			}
		}
	}
}


function fetchValue(sheet, labelCol, dataCol, searchTerm) {
	//assumes label comes before data in column order
	var lastRow = sheet.getLastRow();
	var lastCol = sheet.getLastColumn();
	var arrayRange = sheet.getRange(2, labelCol, lastRow, dataCol);
	var arrayValues = arrayRange.getValues();
	var newDataIndex = dataCol - labelCol;

	for (j = 0; j < lastRow; j++) {
		if (arrayValues[j][0] == searchTerm) {
			var value = arrayValues[j][newDataIndex];
			j = lastRow;
		}
	}
	return value;
}

function getSheet(ssName, sheetName) {
	var URL = fetchValue(resourcesSheet, 2, 5, ssName);
	URL = URL.toString().replace("?usp=drivesdk", "");
	var ss = SpreadsheetApp.openByUrl(URL);
	var sheet = ss.getSheetByName(sheetName);
	return sheet;
}

function getAllSheets(ssName) {
	var URL = fetchValue(resourcesSheet, 2, 5, ssName);
	URL = URL.toString().replace("?usp=drivesdk", "");
	var ss = SpreadsheetApp.openByUrl(URL);
	var allsheets = ss.getSheets();
	return allsheets;
}

function getSheetIndex(ssName, sheetIndex) {
	var URL = fetchValue(resourcesSheet, 2, 5, ssName);
	URL = URL.toString().replace("?usp=drivesdk", "");
	var ss = SpreadsheetApp.openByUrl(URL);
	var sheet = ss.getSheet(sheetIndex);
	return sheet;
}

function loopThruUnits(limit) {
	leaksSheet.clear();
	leaksSheet.clearFormats();
	var lastRowResources = resourcesSheet.getLastRow();
	var arrayRange = resourcesSheet.getRange(2, 2, lastRowResources, 5);
	var arrayValues = arrayRange.getValues();

	if (limit == 99) {
		var counter = lastRowResources - 2;
	} else {
		var counter = limit;
	}
	for (i = 0; i < counter; i++) {
		var unit = arrayValues[i][0];
		var allsheets = getAllSheets(unit);
		for (var s in allsheets) {
			var unitSheet = allsheets[s];



			var checkFileValue = unitSheet.getRange(1, inspTestTypeCol).getValue();

			if (checkFileValue == 'TestType') {
				unitSheet.setFrozenRows(1);
				unitSheet.sort(inspDateCol, true);
				var lastRowUnit = unitSheet.getLastRow();
				var unitRange = unitSheet.getRange(2, 1, lastRowUnit, 12);
				var unitData = unitRange.getValues();
				SpreadsheetApp.getActiveSpreadsheet().toast(i.toString() + ' of ' + lastRowResources.toString() + '.  ' + unit.toString() + '.  Sheet:' + unitSheet.getSheetName().toString(), 'Checking Units for Leakers', -1);
				findLeaks(unitData, lastRowUnit - 1);
				//techList = removeDuplicatesAndSaveTechs(unitData, techList);
				//techSpeed(unitData, unitSheet, 1 , 100, 11);
				//techSpeed(unitData, unitSheet, 24 , 500, 12);

			}
		}
	}
}

function runTechSpeed() {
	loopThruUnitsTechSpeed(42,99 );
   
}

function loopThruUnitsTechSpeed(start, limit) {

	var lastRowResources = resourcesSheet.getLastRow();
	var arrayRange = resourcesSheet.getRange(2, 2, lastRowResources, 5);
	var arrayValues = arrayRange.getValues();
	techList = getTechList();

	if (limit == 99) {
		var counter = lastRowResources - 2;
	} else {
		var counter = limit;
	}
	for (i = start; i < counter; i++) {
		var unit = arrayValues[i][0];
		var allsheets = getAllSheets(unit);
		for (var s in allsheets) {
			var unitSheet = allsheets[s];

			var checkFileValue = unitSheet.getRange(1, inspTestTypeCol).getValue();

			if (checkFileValue == 'TestType') {
				unitSheet.setFrozenRows(1);
				unitSheet.sort(inspDateCol,true);
				var lastRowUnit = unitSheet.getLastRow();
				var unitRange = unitSheet.getRange(2, 5, lastRowUnit, 8);
				unitSheet.insertColumns(9, 2);
				var unitData = unitRange.getValues();
				SpreadsheetApp.getActiveSpreadsheet().toast(i.toString() + ' of ' + lastRowResources.toString() + '.  ' + unit.toString() + '.  Sheet:', unitSheet.getSheetId().toString() +' Checking Units for TechSpeed', -1);
				//findLeaks(unitData, lastRowUnit-1);
				//techList = removeDuplicatesAndSaveTechs(unitData, techList);

				techSpeedv3(unitData, unit, 1, 200, 5, 500);
				

			}
		}
	}
	
}


function findLeaks(data, lastRowIndex) {
	//find leaks    
	for (k = 0; k <= lastRowIndex; k++) {

		var currentPass = data[k][inspPassFailCol - 1];
		var currentClass = data[k][2];
		if (currentPass == '0' && currentClass == 'VALVE') {
			//get tag number and date
			outputArray();
			var currentTag = data[k][inspCompTagCol - 1];
			var currentTime = data[k][inspDateCol - 1];
			var currentPPM = data[k][inspPPMcol - 1];
			var currentUnit = data[k][inspUnitCol - 1];

			for (l = lastRowIndex; l > 1; l--) {
				var unitTag = data[l - 1][inspCompTagCol - 1];
				var unitDate = data[l - 1][inspDateCol - 1];
				var unitPassFail = data[l - 1][inspPassFailCol - 1];
				var unitPPM = data[l - 1][inspPPMcol - 1];

				if (currentTag == unitTag && currentTime > unitDate) {

					if (unitPPM <= leakDef) {
						activeRow[r][5] = 'newleak';

						findNextPassingPpm(data, currentTag, currentTime, currentPPM, lastRowIndex);

					}

					if (currentPPM < leakDef) {
						activeRow[r][5] = 'repairTrigger';
					}
					activeRow[r][3] = unitPPM;
					l = 0;
				}
			}
			activeRow[r][0] = currentTag;
			activeRow[r][1] = currentTime;
			activeRow[r][2] = currentPPM;
			activeRow[r][18] = currentUnit;
			calcDaysToFixed();
			r++;
			addSpacesToArray();
		}
	}
}

function calcDaystoFirstAttempt(leakDate, attDate, row, column) {

	if (attDate != '') {
		var diff = attDate - leakDate;
		var diffToDays = diff / 86400000;
		leaksSheet.getRange(row, column).setValue(diffToDays).setNumberFormat("#.#");
	}
}


function setupRepairs() {
	repairSheet.setFrozenRows(1);
	repairSheet.sort(repInspectionDateCol, false);
	var lastRow = repairSheet.getLastRow();
	var range = repairSheet.getRange(2, 4, lastRow, 7);
	var array = range.getValues();
	return array;
}


function colLabels() {
	if (leaksSheet.getRange(1, 1).getValue() != 'Leak Tag Number') {
		leaksSheet.insertRowBefore(1);
		leaksSheet.getRange(1, 1).setValue("Leaking Tag Number");
		leaksSheet.getRange(1, 2).setValue("Date");
		leaksSheet.getRange(1, 3).setValue("PPM");
		leaksSheet.getRange(1, 4).setValue("Prev PPM");
		leaksSheet.getRange(1, 5).setValue("1st att Date");
		leaksSheet.getRange(1, 6).setValue("Leak Status");
		leaksSheet.getRange(1, 7).setValue("Days to 1st attempt");
		leaksSheet.getRange(1, 8).setValue("Repaired to PPM");
		leaksSheet.getRange(1, 9).setValue("Date Repaired");
		leaksSheet.getRange(1, 10).setValue("Days to Repair");
		leaksSheet.getRange(1, 11).setValue("M1 ppm");
		leaksSheet.getRange(1, 12).setValue("M1 Date");
		leaksSheet.getRange(1, 13).setValue("M1 Due Date");
		leaksSheet.getRange(1, 14).setValue("M1 Status");
		leaksSheet.getRange(1, 15).setValue("M2 ppm");
		leaksSheet.getRange(1, 16).setValue("M2 Date");
		leaksSheet.getRange(1, 17).setValue("M2 Due Date");
		leaksSheet.getRange(1, 18).setValue("M2 Status");
		leaksSheet.getRange(1, 19).setValue("Unit");
		leaksSheet.setFrozenRows(1);

	}
}

function findNextPassingPpm(data, currentTag, currentTime, currentPPM, lastRowIndex) {

	for (m = 1; m <= lastRowIndex; m++) {
		var unitPassFail = data[m - 1][inspPassFailCol - 1];
		if (unitPassFail == '1') {
			var unitTag = data[m - 1][inspCompTagCol - 1];
			var unitDate = data[m - 1][inspDateCol - 1];
			var unitPPM = data[m - 1][inspPPMcol - 1];


			if (currentTag == unitTag && currentTime <= unitDate) {
				activeRow[r][7] = unitPPM;
				activeRow[r][8] = unitDate;


				calcM1M2Dates(data, unitDate, lastRowIndex, 1, 11);
				calcM1M2Dates(data, unitDate, lastRowIndex, 2, 15);
				findNextMonthInspection(data, unitDate, currentTag, currentTime, currentPPM, lastRowIndex, 11);
				findNextMonthInspection(data, unitDate, currentTag, currentTime, currentPPM, lastRowIndex, 15);



				m = lastRowIndex;
			}
		}
	}
}

function findNextMonthInspection(data, lastRepairTime, currentTag, currentTime, currentPPM, lastRowIndex, writeToCol) {


	var dueDate = new Date(activeRow[r][writeToCol + 1]);
	//var dueDate = new Date(leaksSheet.getRange(3, writeToCol+2).getValue());
	var tooSoon = new Date(dueDate);
	var month = tooSoon.getMonth();
	month = month - 1;
	tooSoon.setMonth(month);

	for (p = lastRowIndex; p > 1; p--) {
		var unitPassFail = data[p - 1][inspPassFailCol - 1];
		var unitTag = data[p - 1][inspCompTagCol - 1];
		var unitDate = data[p - 1][inspDateCol - 1];
		var unitPPM = data[p - 1][inspPPMcol - 1];

		// if(currentTag== unitTag && lastRepairTime < unitDate && unitDate>= tooSoon && currentPPM>=500 && unitDate <= dueDate){
		if (currentTag == unitTag && unitDate >= tooSoon && unitDate <= dueDate) {
			//leaks.getRange(2, writeToCol).setValue(unitPpm);
			activeRow[r][writeToCol - 1] = unitPPM;
			//leaks.getRange(2, writeToCol).setNumberFormat("#");

			//leaks.getRange(2, writeToCol+1).setValue(unitDate);
			activeRow[r][writeToCol] = unitDate;
			p = 0;

			if (unitDate > dueDate) {
				// leaks.getRange(l, writeToCol+3).setValue(unitDate);
				//leaks.getRange(l, writeToCol+3).setValue('early/late M').setBackground('red');
				activeRow[r][writeToCol + 2] = 'early/late M';
			}
		}

	}
}

function calcM1M2Dates(data, lastRepairTime, lastRowIndex, intervalMonth, writeToCol) {
	var month;
	var year;
	var dueDate = new Date();

	for (o = lastRowIndex; o > 1; o--) {
		year = lastRepairTime.getYear();
		month = lastRepairTime.getMonth();
		month = month + intervalMonth + 1;
		dueDate.setYear(year);
		dueDate.setMonth(month);
		dueDate.setDate(1);
		activeRow[r][writeToCol + 1] = dueDate



	}


}

function outputArray() {


	activeRow.push([
		[]
	]);



}

function addSpacesToArray() {



	for (t = 0; t <= 24; t++) {
		activeRow[r][t] = ' ';

	}



}

function calcDaysToFixed() {
	var fixedDate = activeRow[r][8];
	var leakDate = activeRow[r][1];



	if (fixedDate != "" && leakDate != "" && activeRow[r][5] == 'newleak') {
		var diff = fixedDate - leakDate;
		var diffToDays = diff / 86400000;
		if (diffToDays >= 0) {
			activeRow[r][9] = diffToDays;
		}
		//leaks.getRange(n,10).setValue(diffToDays).setNumberFormat("#.#");
	}
}

function calcM1M2DatesNewComp(dateCol, intervalMonth, writeToCol, countCurrentMonth, resetDays) {
	var month;
	var year;
	var day;
	var status;
	var allSheetsNewComp = getAllSheets('Activated Components');
	var lastUnit;

	for (z in allSheetsNewComp) {


		var newCompRange = allSheetsNewComp[z].getRange(1, 1, allSheetsNewComp[z].getMaxRows(), allSheetsNewComp[z].getMaxColumns());
		var newCompArray = newCompRange.getValues();
		var maxRow = newCompArray.length;

		for (q = maxRow; q > 1; q--) {
			if (newCompArray[q - 1][dateCol - 1] != '') {

				var dateStartNew = new Date(newCompArray[q - 1][5]);
				var dateStart = new Date(dateStartNew);
				var dateNext = new Date(dateStart);
				month = dateStart.getMonth();
				year = dateStart.getYear();
				var monthNext = month + intervalMonth + 1;

				if (countCurrentMonth == 'Yes') {
					var monthStart = month;
				}
				if (countCurrentMonth == 'No') {

					var monthStart = month + 1;

				}
				dateStart.setYear(year);
				dateStart.setMonth(monthStart);
				if (resetDays == '1') {
					dateStart.setDate(1);
				}
				dateStart.setMonth(monthStart);
				dateNext.setYear(year);
				dateNext.setDate(1);
				dateNext.setMonth(monthNext);


				newCompArray[q - 1][writeToCol - 1] = dateNext;
				var newCompTag = newCompArray[q - 1][4];
				var newCompUnit = newCompArray[q - 1][3];

				if (lastUnit != newCompUnit) {
					var currentSheets = getAllSheets(newCompUnit);
					var currentSheet = currentSheets[0];
					var csLastRow = currentSheet.getLastRow();
					var csLastCol = currentSheet.getLastColumn();
					var unitSearchRange = currentSheet.getRange(1, 1, csLastRow, csLastCol);
					var unitSearchValues = unitSearchRange.getValues();
				}
				for (w = 0; w < unitSearchValues.length; w++) {
					var unitTag = unitSearchValues[w][1];
					var unitDate = unitSearchValues[w][4];



					if (newCompTag == unitTag && unitDate < dateNext && unitDate > dateStart) {
						var newFoundInsp = unitTag;
						newCompArray[q - 1][writeToCol] = unitDate;
						w = unitSearchValues.length;
					}


				}
				lastUnit = newCompUnit;


			}
		}


		maxRow = newCompArray.length;
		var maxCol = newCompArray[0].length;
		allSheetsNewComp[z].getRange(1, 1, maxRow, maxCol).setValues(newCompArray);

	}
	allSheetsNewComp[z].getRange(1, writeToCol).setValue("dueDate");
	allSheetsNewComp[z].getRange(1, writeToCol + 1).setValue("Found Inspection");
}

function m1m3NewCompsMethod1() {
	calcM1M2DatesNewComp(5, 1, 7, 'Yes', '0');
	calcM1M2DatesNewComp(5, 1, 9, 'No', '1');
}

function m1m3NewCompsMethod2() {
	calcM1M2DatesNewComp(5, 0, 7, 'Yes', '0');
	calcM1M2DatesNewComp(5, 0, 9, 'No', '1');
}

function removeDuplicatesAndSaveTechs(data, newData) {



	for (tt in data) {
		var row = data[tt];
		var duplicate = false;
		for (tech in newData) {
			if (row[7] == newData[tech][7]) {
				duplicate = true;
			}
		}
		if (!duplicate) {
			newData.push(row);
		}
	}
	techsSheet.clearContents();
	techsSheet.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
	return newData;
}

function getTechList() {
	var maxRow = techsSheet.getLastRow();
	var maxCol = techsSheet.getLastColumn();
	return techsSheet.getRange(1, 1, maxRow, maxCol).getValues();
}


function techSpeed(data, unitSheet, timeWindow, failValue1, outputColumn, failValue2) {

	var unitDate;
	var unitTech;
	var currentTech;
	var currentTagTime;
	var unitSearchValues = data;
	var techSearchValues = techList;
	var numberOfHours = 1;
	//COLUMNS 	
	var techCol = 4;
	var timeCol = 1;

for (runTwice = 0; runTwice <= 1;){
	runTwice++;
	if (runTwice == 2){
		var failValue = failValue2;
		outputColumn++;
        timeWindow= 24;
	}else{
		var failValue = failValue1;
	}
 	 
	//loop thru Techs
	for (kk in techSearchValues) {
		var focusTech = techSearchValues[kk][7];

		//loop thru inspections looking for tech matches
		for (jj in unitSearchValues) {
			var numOfInsp = 1;

			currentTech = unitSearchValues[jj][techCol - 1];
			if (currentTech != '') {


				//we found a match 
				if (currentTech == focusTech) {

					//Start where we left off last time
					for (ii = jj; ii < unitSearchValues.length - 1;) {
						currentTagTime = unitSearchValues[jj][timeCol - 1];
						var oneXLater = new Date(currentTagTime.getTime() + (60 * 1000 * 60 * timeWindow));
						ii++;
						unitTech = unitSearchValues[ii][techCol - 1];
						unitDate = unitSearchValues[ii][timeCol - 1];
						//Check that he next row is still the same tech
						if (focusTech === unitTech && unitDate < oneXLater && unitDate > currentTagTime) {
							numOfInsp = numOfInsp + 1;
						}
						if (unitDate > oneXLater) {
							ii = unitSearchValues.length + 10;

							if (numOfInsp > failValue) {


								failures.push(unitSearchValues[jj]);
							}
						}
					}
				}
			}
		}
	}
}
}

function writePaceFailures(unit) {

	//var unitSearchnumRows= unitSearchValues.length;
	//var unitSearchCol= unitSearchValues[0].length;
	//var sheetRange= unitSheet.getRange(2, 1, unitSearchnumRows, unitSearchCol);
	//sheetRange.setValues(unitSearchValues);
  failures[0][0]= unit;
	var failuresRow = failures.length;
	var failuresCol = failures[0].length;
	var failuresSheet = ssMaster.getSheetByName('PaceFailures');
	failuresSheet.insertRows(1, failuresRow);
	var failuresRange = failuresSheet.getRange(1, 1, failuresRow, failuresCol);

	failuresRange.setValues(failures);
  failures = [
	["nan", "", "", "", "", "", "", ""]
];

}

function ifNotDone(functionName, functionRow){
	if (functionArray[functionRow] != '1'){
		functionName;
		functionArray[functionRow]= '1';
		//functionArrayRow = functionArray.length;

	var functionRange = functionSheet.getRange(functionRow+1, 1, 1, 1);
	functionRange.setValues(functionArray[functionRow]);
	}
}

function getFunctionArray(){

}

function techSpeedv2(data, unitSheet, timeWindow, failValue1, outputColumn, failValue2) {

	var unitDate;
	var unitTech;
	var currentTech;
	var currentTagTime;
	var unitSearchValues = data;
	var techSearchValues = techList;
	var numberOfHours = 1;
	//COLUMNS 	
	var techCol = 4;
	var timeCol = 1;

for (runTwice = 0; runTwice <= 1;){
	runTwice++;
	if (runTwice == 2){
		var failValue = failValue2;
		outputColumn++;
        timeWindow= 24;
	}else{
		var failValue = failValue1;
	}
 	 
	//loop thru Techs

		
		//var techsInspections = unitSearchValues.filter(function(item){return ;});

		//loop thru inspections looking for tech matches
		for (jj in unitSearchValues) {
			var focusTech = unitSearchValues[jj][7];
			var numOfInsp = 1;
          var numberOfInspByTech = unitSearchValues.length;
			if  (unitSearchValues.length > 1){

						currentTagTime = unitSearchValues[jj][timeCol - 1];
						var oneXLater = new Date(currentTagTime.getTime() + (60 * 1000 * 60 * timeWindow));
						//unitTech = unitSearchValues[jj+1][techCol - 1];
						//unitDate = unitSearchValues[jj+][timeCol - 1];
						//Check that he next row is still the same tech

						var meetsWindow = unitSearchValues.filter(function(item){
							if (item[timeCol-1] < oneXLater && item[timeCol-1]  > currentTagTime && item[techCol-1] == focusTech)
							{
								return true;

							} 
							return false;
						});
							numOfInsp = meetsWindow.length;

							if (numOfInsp > failValue) {


								failures.push(unitSearchValues[jj]);
							}
						}
					}
				}
			}
			function techSpeedv3(data, unitName, timeWindow, failValue1, outputColumn, failValue2) {
	var unitDate;
	var unitTech;
	var currentTech;
	var currentTagTime;
	var unitSearchValues = data;
	var techSearchValues = techList;
	var numberOfHours = 1;
	//COLUMNS 	
	var techCol = 4;
	var timeCol = 1;

for (runTwice = 0; runTwice <= 1;){
	runTwice++;
	if (runTwice == 2){
		var failValue = failValue2;
		outputColumn++;
        timeWindow= 24;
	}else{
		var failValue = failValue1;
	}
 	 
	//loop thru Techs
	for (kk in techSearchValues) {

		var focusTech = techSearchValues[kk][7];
								var techsInspections = unitSearchValues.filter(function(item){
							if (item[techCol-1] == focusTech)
							{
								return true;

							} 
							return false;
						});

		//loop thru inspections looking for tech matches
		for (jj in techsInspections) {
			var numOfInsp = 1;

			currentTech = techsInspections[jj][techCol - 1];
			if (currentTech != '') {


				//we found a match 
				if (currentTech == focusTech) {

					//Start where we left off last time
					for (ii = jj; ii < techsInspections.length - 1;) {
						currentTagTime = techsInspections[jj][timeCol - 1];
						var oneXLater = new Date(currentTagTime.getTime() + (60 * 1000 * 60 * timeWindow));
						ii++;
						unitTech = techsInspections[ii][techCol - 1];
						unitDate = techsInspections[ii][timeCol - 1];
						//Check that he next row is still the same tech
						if (focusTech === unitTech && unitDate < oneXLater && unitDate > currentTagTime) {
							numOfInsp = numOfInsp + 1;
						}
						if (unitDate > oneXLater) {
							ii = techsInspections.length + 10;

							if (numOfInsp > failValue) {

failures.push(techsInspections[jj]);
                              lastRowOfFailures = failures.length;
								failures[lastRowOfFailures-1][outputColumn-1] = numOfInsp;
                              failures[lastRowOfFailures-1][1] = unitName;
								

                            }else{ Logger.log(focusTech + ' had ' + numOfInsp + ' on line ' + jj);  
			
                              
						}
					}
				}
			}
		}
	}
}writePaceFailures(unitName);
}
}