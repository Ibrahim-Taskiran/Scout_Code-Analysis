Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "cmd /c cd /d """ & strPath & """ && start """" """ & strPath & "\node_modules\electron\dist\electron.exe"" .", 0, False
