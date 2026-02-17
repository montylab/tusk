---
name: List Files
description: Generate a flat list of all files in a directory, filtered by extension, and save it to a specifed output file.
---

# List Files Skill

Generate a newline-separated list of all files in a given directory (recursively), filtered by file extension.

## Parameters

| Parameter      | Required | Description                                                                                               |
| :------------- | :------: | :-------------------------------------------------------------------------------------------------------- |
| **Folder**     |    ✅    | Absolute path to the directory to scan                                                                    |
| **Extension**  |    ✅    | File extension to filter by (without leading dot, e.g. `vue`, `ts`, `md`). Can be a comma-separated list. |
| **OutputFile** |    ✅    | Absolute path to the output text file where the list will be saved.                                       |

## Steps

// turbo-all

1. Detect the operating system to choose the correct command.

2. Run the appropriate command to find files matching the extensions in the folder and save to `<OutputFile>`.

   ### Windows (PowerShell)

   ```powershell
   $include = "<Extension>".Split(',') -replace '^', '*.'
   Get-ChildItem -Path "<Folder>" -Recurse -Include $include | Select-Object -ExpandProperty FullName | Out-File -FilePath "<OutputFile>" -Encoding UTF8
   ```

   ### Linux / macOS (Bash)

   ```bash
   # Convert "vue,ts,js" to "-name *.vue -o -name *.ts -o -name *.js" logic
   # This is a simplified example; complex logic might be needed for dynamic extensions in bash one-liners
   # Alternatively, use `fd` if available, or widespread `find`.

   # Using fd (if available)
   # fd -t f -e vue -e ts -e js . "<Folder>" > "<OutputFile>"

   # Using find
   find "<Folder>" -type f \( -name "*.vue" -o -name "*.ts" -o -name "*.js" \) > "<OutputFile>"
   ```

3. Report the completion and the location of the output file.
