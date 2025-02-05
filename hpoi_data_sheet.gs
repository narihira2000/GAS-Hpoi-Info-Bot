const sheetId = "";

//存最新筆的資料
function doPost(e) {
    let params = e.parameter;
    let hobbyId = params.hobby_id;
    let infoType = params.info_type;
    let title = params.title;
      
    let SpreadSheet = SpreadsheetApp.openById(sheetId);
    let Sheet = SpreadSheet.getSheetByName("工作表1");
  
    Sheet.getRange(2, 1).setValue(hobbyId);
    Sheet.getRange(2, 2).setValue(infoType);
    Sheet.getRange(2, 3).setValue(title);
  
    return ContentService.createTextOutput("success");
  }
  
  //回傳最新筆的資料內容
  function doGet(){
  
    let SpreadSheet = SpreadsheetApp.openById(sheetId);
    let Sheet = SpreadSheet.getSheetByName("工作表1");
  
    let hobbyId = Sheet.getRange(2, 1).getValue();
    let infoType = Sheet.getRange(2, 2).getValue();
    let title = Sheet.getRange(2, 3).getValue();
  
    let output = {
      hobby_id: hobbyId,
      info_type: infoType,
      title: title
    };
    
    return ContentService.createTextOutput((output)).setMimeType(ContentService.MimeType.JSON);
  }
  