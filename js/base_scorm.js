
///////// CONSOLE LOGGING ALA Twitter!
if ( ! window.console ) {
  (function() {
    var names = ["log", "debug", "info", "warn", "error",
        "assert", "dir", "dirxml", "group", "groupEnd", "time",
        "timeEnd", "count", "trace", "profile", "profileEnd"],
        i, l = names.length;
    window.console = {};
    for ( i = 0; i < l; i++ ) {
      window.console[ names[i] ] = function() {};
    }
  }());
}



/////////////// SETUP VARIABLES


var findAPITries = 0;
var timerId = null;
var userId = null;
var reportTimer = null;


// Reconfigure the following items to customize to the client.
var scormSrv = "found.pagekite.me"
var scormSrvUrl = "http://" + scormSrv + "/external_sco";
var ReturnUrl = window.location.href.substring(0,window.location.href.indexOf("scormAdapter.htm")) + "scormAdapter.htm";


function setupScoreFrame(){
  $("body").append('<div id="scoreCheckFrame"></div>');
  timerId = setInterval(getScores, 15000);
}

function getScores()
{
		var getScoresUrl = scormSrvUrl + "?func=get_scores&orgID="+orgId+"&orgKey="+orgKey+"&courseID="+courseId+"&extID="+userId+"&returnUrl="+ReturnUrl;
    console.log("getScores(); url = "+getScoresUrl)
    $("#scoreCheckFrame").html('<iframe name="scoreFrame" src="' + getScoresUrl + '"></iframe>');
    // reportTimer = setTimeout(reportTheScore, 2000);
}

function reportTheScore()
{
  console.log("The URL of the SCORE IFRAME: ")
  var scoreFrameUrl = $("#scoreCheckFrame iframe").attr('src')
  console.log(scoreFrameUrl)

  var scoreFrame = document.frames['scoreFrame']

  var lessonStatus = pluckURLParameter("Lesson_Status",scoreFrame);
  var score = pluckURLParameter("Score",scoreFrame);
  console.log("lessonStatus: "+lessonStatus)
  console.log("score: "+score)

  // lmsResult = lmsAPI.LMSSetValue("cmi.core.lesson_status",lessonStatus);
  // if (lmsResult == "false")
  //   alertScormError("LMSSetValue(\"cmi.core.lesson_status\",\"" + lessonStatus + "\")");


  // lmsResult = lmsAPI.LMSSetValue("cmi.core.score.raw",score);
  // if (lmsResult == "false")
  //   alertScormError("LMSSetValue(\"cmi.core.score.raw\",\"" + score + "\")");

  // lessonStatus = lmsAPI.LMSGetValue("cmi.core.lesson_status");
  // score = lmsAPI.LMSGetValue("cmi.core.score.raw");

}


// remove leading and trailing white space
function trim(string)
{
  if (string == "" || string == undefined){
    return " "
  } 
  return string.replace(/^\s+/, "").replace(/\s+$/, "");
}

function findAPI(win)
{
   // Check to see if the window (win) contains the API
   // if the window (win) does not contain the API and
   // the window (win) has a parent window and the parent window
   // is not the same as the window (win)
   while ( (win.API == null) &&
           (win.parent != null) &&
           (win.parent != win) )
   {
      // increment the number of findAPITries
      findAPITries++;

      // Note: 7 is an arbitrary number, but should be more than sufficient
      if (findAPITries > 7)
      {
         alert("Error finding API -- too deeply nested.");
         return null;
      }

      // set the variable that represents the window being
      // being searched to be the parent of the current window
      // then search for the API again
      win = win.parent;
   }
   return win.API;
}

function getAPI()
{
   // start by looking for the API in the current window
   var theAPI = findAPI(window);

   // if the API is null (could not be found in the current window)
   // and the current window has an opener window
   if ( (theAPI == null) &&
        (window.opener != null) &&
        (typeof(window.opener) != "undefined") )
   {
      // try to find the API in the current windowís opener
      theAPI = findAPI(window.opener);
   }
   // if the API has not been found
   if (theAPI == null)
   {
      // Alert the user that the API Adapter could not be found
      alert("Unable to find an API adapter");
   }
   return theAPI;
}

function alertScormError(context, ignoreUnsupported)
{
  if (typeof(ignoreUnsupported) == "undefined")
    ignoreUnsupported = false;

  if (lmsAPI != null)
  {
    var errorCode = lmsAPI.LMSGetLastError();
    if (ignoreUnsupported && errorCode == "401")
      return;
    var errorString = lmsAPI.LMSGetErrorString(errorCode);
    var moreInfo = lmsAPI.LMSGetDiagnostic(errorCode);

    alert("The following SCORM error has occurred:\nContext=" + context +
      "\nError code=" + errorCode +
      "\nError Message=" + errorString +
      "\nDiagnostic=" + moreInfo);
  }
}


function pluckURLParameter(name, doc) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(doc.location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}
// THIS IS THE NEW Query string getter
function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

function SCORM_INIT() {
  console.info("TRYING TO FIND THE LMS API")
  // Get the LMS SCORM API.
  window.lmsAPI = getAPI();
  console.log(lmsAPI);
  var lmsResult;

  if (lmsAPI != null)
  {
    lmsResult = lmsAPI.LMSInitialize("");
    if (lmsResult == "false"){
      // Couldn't initialize via the LMS.
      console.warn("Could not Init the LMS")
      // alertScormError("LMSInitialize()");        
    } else {
      console.info("Could Init the LMS")
      // Get the userId (i.e. Student Id) from the LMS
      userId = lmsAPI.LMSGetValue("cmi.core.student_id");
      if (lmsAPI.LMSGetLastError() != 0)
        alertScormError("LMSGetValue(\"cmi.core.student_id\")");

      // Get the user name (i.e. Student name) from the LMS
      var userName = lmsAPI.LMSGetValue("cmi.core.student_name");
      if (lmsAPI.LMSGetLastError() != 0)
        alertScormError("LMSGetValue(\"cmi.core.student_name\")");

      var nameArray = userName.split(",");

      var regStuUrl = scormSrvUrl +
        "?func=get_param&" +
        "courseID=" + courseId +
        "&orgID=" + orgId +
        "&extID=" + userId +
      "&orgKey=" + orgKey +
        "&lastname=" + escape(trim(nameArray[0])) +
        "&firstname=" + escape(trim(nameArray[1]));

    console.log("I am inside the Course Init, setting mah interval, and your iframe with regStuUrl")
    $("body").html('<iframe src="' + regStuUrl + '"></iframe>');
    setupScoreFrame();
    }
  }  
}

$(document).ready(function(){
  var css = " \
  iframe { border: none; width: 100%; height: 100%; overflow: scroll;} \
  body {margin: 0; padding: 0; } \
  h1 {font-family: 'Helvetica'; font-weight: bold; font-size: 36pt;} \
  "

  // $("head").append('<link rel="stylesheet" href="//raw.https://raw.github.com/phoenix-scitent/aha_scorm_js/master/scorm.css">')
  $("head").append('<style type="text/css">' + css + '</style>');

  if (window.scorm_initialized == false || window.scorm_initialized == undefined) {
    SCORM_INIT();
    window.scorm_initialized = true;    
  }
  // $("body").html('<iframe src="//found.pagekite.me/external_sco?func=get_param&courseID=4&orgID=1&extID=admin&orgKey=6F5RMU26D&lastname=Ruoto&firstname=Joe"></iframe>');
  // console.log("I made a hard iframe and a div#scoreCheckFrame") 
});

  

// <fuseaction name="getScore">
//      <do action="mPortal.getScoreForLMS" /> <!-- will check attributes there -->
//      <if condition="isDefined('attributes.score')">
//       <true>
//        <relocate url="#attributes.returnURL#?action=exit&amp;Lesson_Status=#attributes.lessonStatus#&amp;Score=#attributes.score#" />
//       </true>
//      </if>
//      <if condition="isDefined('attributes.errorCode')">
//       <true>
//        <relocate url="#attributes.returnURL#?action=error&amp;code=#attributes.errorcode#&amp;stuid=#attributes.extId#" />
//       </true>
//      </if> 
//  </fuseaction>


// else if (action == "exit")
//     {
//       alert("How are we getting here?")
//       lmsResult = lmsAPI.LMSInitialize("");
//       // The SCO is exiting.
//   //    var lessonLocation = getURLParameter("Lesson_Location");
//       var lessonStatus = getURLParameter("Lesson_Status");
//       var score = getURLParameter("Score");

//   //  var lessonLocation = lmsAPI.LMSGetValue("cmi.core.lesson_location");

//       lmsResult = lmsAPI.LMSSetValue("cmi.core.lesson_status",getURLParameter('Lesson_Status'));
//       if (lmsResult == "false")
//         alertScormError("LMSSetValue(\"cmi.core.lesson_status\",\"" + getURLParameter('Lesson_Status') + "\")");

//   //    lmsResult = lmsAPI.LMSSetValue("cmi.core.lesson_location",getURLParameter('Lesson_Location"));
//   //    if (lmsResult == "false")
//   //      alertScormError("LMSSetValue(\"cmi.core.lesson_location\",\"" + getURLParameter('Lesson_Location') + "\")");

//       lmsResult = lmsAPI.LMSSetValue("cmi.core.score.raw",getURLParameter('Score'));
//       if (lmsResult == "false")
//         alertScormError("LMSSetValue(\"cmi.core.score.raw\",\"" + getURLParameter('Score') + "\")");

//     lessonStatus = lmsAPI.LMSGetValue("cmi.core.lesson_status");
//     score = lmsAPI.LMSGetValue("cmi.core.score.raw");

//       lmsResult = lmsAPI.LMSFinish("");
//       if (lmsResult == "false")
//         // Couldn't finish via the LMS.
//         alertScormError("LMSFinish()");

//   //  alert("Lesson Status: " + lessonStatus + "\nScore: " + score);
//     }
//     else if (action == "error")
//     {
//       console.warn("LMS reported an ERROR")
//       var errorCode = getURLParameter("code");
//       console.warn("Error Code:" + errorCode);
//       var errorMessage = null;

//       if (errorCode == "1001")
//       {
//         errorMessage = "Unable to retrieve score for user '" + getURLParameter("stuid") + "'.\nIt appears that the course was not completed.";

//       }
//       else if (errorCode == "1002")
//       {
//         errorMessage = "Course: '" + getURLParameter("cid") + "' doesn't exist.";
//       }
//       console.warn(errorMessage)

//       document.write("Scitent Scorm error: (" + errorCode + ")\n" + errorMessage);

//       lmsResult = lmsAPI.LMSFinish("");
//       console.log("Trying LMSFinish()");
//       if (lmsResult == "false")
//         // Couldn't finish via the LMS.
//         alertScormError("LMSFinish()");
//         console.warn("Could not execute LMSFinish()");
//     }