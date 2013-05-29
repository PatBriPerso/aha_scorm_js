alert("timmy")

// change courseInNewWindow to false if the LMS plays the course without popping a new window.
var courseInNewWindow=true;

var findAPITries = 0;
var courseWindow =null;
var timerId = null;
var userId = null;
var courseId = null;

// Reconfigure the following items to customize to the client.
var scormSrv = "found.pagekite.me"
var scormSrvUrl = "http://" + scormSrv + "/external_sco";
var ReturnUrl = window.location.href.substring(0,window.location.href.indexOf("scormAdapter.htm")) + "scormAdapter.htm";


function getScores()
{
		var getScoresUrl = scormSrvUrl + "?func=get_scores&orgId="+orgID+"&courseID="+courseID+"&extID="+userID+"&returnUrl="+ReturnUrl;
		window.location.replace(getScoresUrl);
}

function checkCourseWindow()
{
	if (courseWindow && courseWindow.closed)
	{
		clearInterval(timerId);
		// call Scorm Server URL and get scores
		setTimeout("getScores()", 1000);
	}
}

// remove leading and trailing white space
function trim(string)
{
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

function getPassedParm(parm,lowerCase)
{
  if (location.search == "")
    return "";

  if (typeof(lowerCase) == "undefined")
    // Maintains compatibility with code that called this without the parameter.
    lowerCase = true;

  var parmList = "&" + location.search.substring(1,location.search.length) + "&";
  var re = new RegExp("&" + parm + "=([^&]*)&","i");
  var foundArray = re.exec(parmList);
  if (foundArray == null)
    return "";

  return lowerCase ? foundArray[1].toLowerCase() : foundArray[1];
}

function GetParam( name ) {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );

	if( results == null )
		return "";
	else
		return results[1];
}


// Get the LMS SCORM API.
var lmsAPI = getAPI();
var lmsResult;

if (lmsAPI != null)
{
  var action = getPassedParm("action");
  if (action == "")
    action = "init";

  if (action == "init")
  {
    lmsResult = lmsAPI.LMSInitialize("");
    if (lmsResult == "false")
      // Couldn't initialize via the LMS.
      alertScormError("LMSInitialize()");
    else
    {
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

	// wait loop to check for when courseWindow closes
    // when this happens get scores from Scorm Server Url
    timerId = setInterval(checkCourseWindow, 1000);
    setTimeout('courseWindow=window.open(regStuUrl,"", "status,resizable,scrollbars")', 5000);
    }
  }
  else if (action == "exit")
  {
    // The SCO is exiting.
//    var lessonLocation = getPassedParm("Lesson_Location");
    var lessonStatus = getPassedParm("Lesson_Status");
    var score = getPassedParm("Score");

//	var lessonLocation = lmsAPI.LMSGetValue("cmi.core.lesson_location");

    lmsResult = lmsAPI.LMSSetValue("cmi.core.lesson_status",GetParam('Lesson_Status'));
    if (lmsResult == "false")
      alertScormError("LMSSetValue(\"cmi.core.lesson_status\",\"" + GetParam('Lesson_Status') + "\")");

//    lmsResult = lmsAPI.LMSSetValue("cmi.core.lesson_location",GetParam('Lesson_Location"));
//    if (lmsResult == "false")
//      alertScormError("LMSSetValue(\"cmi.core.lesson_location\",\"" + GetParam('Lesson_Location') + "\")");

    lmsResult = lmsAPI.LMSSetValue("cmi.core.score.raw",GetParam('Score'));
    if (lmsResult == "false")
	    alertScormError("LMSSetValue(\"cmi.core.score.raw\",\"" + GetParam('Score') + "\")");

	lessonStatus = lmsAPI.LMSGetValue("cmi.core.lesson_status");
	score = lmsAPI.LMSGetValue("cmi.core.score.raw");

    lmsResult = lmsAPI.LMSFinish("");
    if (lmsResult == "false")
      // Couldn't finish via the LMS.
      alertScormError("LMSFinish()");

//	alert("Lesson Status: " + lessonStatus + "\nScore: " + score);
  }
  else if (action == "error")
  {
    var errorCode = getPassedParm("code");
    var errorMessage = null;

    if (errorCode == "1001")
    {
      errorMessage = "Unable to retrieve score for user '" + getPassedParm("stuid") + "'.\nIt appears that the course was not completed.";

    }
    else if (errorCode == "1002")
    {
      errorMessage = "Course: '" + getPassedParm("cid") + "' doesn't exist.";
    }

    document.write("Scitent Scorm error: (" + errorCode + ")\n" + errorMessage);

    lmsResult = lmsAPI.LMSFinish("");
    if (lmsResult == "false")
      // Couldn't finish via the LMS.
      alertScormError("LMSFinish()");
  }
}

// *********************************** Instruction Text **************************************

window.instructions="<h2>Welcome!</h2>" +
"Your course will automatically launch in a separate window." +
"<BR><BR>" +
"<font style='color:red; font-weight:bold;'>Please do not close this window until you have finished using the course.</font>";

if (action == "exit")
{
	window.instructions="<h2>Thank you!</h2>" +
	"Thank you for using our course. We hope it was a rich learning experience for you.<br>" +
	"Your score was: " + score + " (" + lessonStatus + ")";
	if (courseInNewWindow) window.instructions+="<br><font style='color:green; font-weight:bold;'>You may now safely close this window.</font>";
}
// *******************************************************************************************
