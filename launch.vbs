Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c set ""PATH=C:\Program Files\nodejs;%PATH%"" && cd /d ""c:\Users\ibrah\Documents\GitHub\Scout_Code-Analysis"" && npm start", 0, False
