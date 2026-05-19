try {
    $input_json = [Console]::In.ReadToEnd()
    $data = $input_json | ConvertFrom-Json
    $file = $data.tool_input.file_path

    if (-not $file) { exit 0 }

    $normalizedFile = $file -replace '\\', '/'
    if ($normalizedFile -notmatch '/src/') { exit 0 }
    if ($normalizedFile -notmatch '\.(ts|tsx)$') { exit 0 }
    if ($normalizedFile -match '\.test\.(ts|tsx)$') { exit 0 }

    $base = [System.IO.Path]::GetFileNameWithoutExtension($file)
    $dir  = [System.IO.Path]::GetDirectoryName($file)

    $testTs  = Join-Path $dir "$base.test.ts"
    $testTsx = Join-Path $dir "$base.test.tsx"

    if (-not (Test-Path $testTs) -and -not (Test-Path $testTsx)) {
        [Console]::Error.WriteLine("⚠ 테스트 파일 없음: $file")
    }
} catch {
    # 에러 발생 시 무시하고 항상 성공 종료
}
exit 0
