var sheetId = "";

//存最新筆的資料
function doPost(e) {
    var params = e.parameter;
    var hobbyId = params.hobby_id;
    var infoType = params.info_type;
    var title = params.title;
      
    var SpreadSheet = SpreadsheetApp.openById(sheetId);
    var Sheet = SpreadSheet.getSheetByName("工作表1");
  
    Sheet.getRange(2, 1).setValue(hobbyId);
    Sheet.getRange(2, 2).setValue(infoType);
    Sheet.getRange(2, 3).setValue(title);
  
    return ContentService.createTextOutput("success");
  }
  
  //回傳最新筆的資料內容
  function doGet(){
  
    var SpreadSheet = SpreadsheetApp.openById(sheetId);
    var Sheet = SpreadSheet.getSheetByName("工作表1");
  
    var hobbyId = Sheet.getRange(2, 1).getValue();
    var infoType = Sheet.getRange(2, 2).getValue();
    var title = Sheet.getRange(2, 3).getValue();
  
    var output = {
      hobby_id: hobbyId,
      info_type: infoType,
      title: title
    };
    
    return ContentService.createTextOutput((output)).setMimeType(ContentService.MimeType.JSON);
  }
  