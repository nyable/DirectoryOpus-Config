    @echo off
    setlocal EnableDelayedExpansion
    
    if '%1'=='' (
        goto :usage
    )
    
    if '%2'=='' (
        goto :usage
    )

    set size1=32
    set size2=48
    
    montage %1 -geometry 20x20+1+1 -tile 16 -background transparent -filter Lanczos %TEMP%\%2-22.png
    montage %1 -geometry 30x30+1+1 -tile 16 -background transparent -filter Lanczos %TEMP%\%2-32.png
    
    echo. > %TEMP%\%2.tmp
    set row=1
    set col=1
    for %%i in (%1) do (
        echo         ^<icon row="!row!" col="!col!" name="%%~ni"/^>                          >> %TEMP%\%2.tmp
        set /A col=col+1
        if !col! GTR 16 (
            set col=1
            set /A row=row+1
        )
    )
    echo. >> %TEMP%\%2.tmp
    
    
    echo ^<?xml version="1.0" encoding="UTF-8"?^>                                             > %TEMP%\%2.xml
    echo ^<iconset name="%2"^>                                                               >> %TEMP%\%2.xml
    echo ^<display_name^>Directory Opus %2^</display_name^>                                  >> %TEMP%\%2.xml
    echo      ^<copyright^>^</copyright^>                                                    >> %TEMP%\%2.xml
    echo      ^<artist^>^</artist^>                                                          >> %TEMP%\%2.xml
    
    
    echo      ^<set filename="%2-22.png" height="22" size="small" width="22"^>               >> %TEMP%\%2.xml
    type %TEMP%\%2.tmp >> %TEMP%\%2.xml
    echo      ^</set^>                                                                       >> %TEMP%\%2.xml
    
    
    echo      ^<set filename="%2-32.png" height="32" size="large" width="32"^>               >> %TEMP%\%2.xml
    type %TEMP%\%2.tmp >> %TEMP%\%2.xml
    echo     ^</set^>                                                                        >> %TEMP%\%2.xml

    
    echo ^</iconset^>                                                                        >> %TEMP%\%2.xml

    del %TEMP%\%2.tmp

    if exist zip.exe (
        zip -j %2.dis %TEMP%\%2-22.png %TEMP%\%2-32.png %TEMP%\%2.xml
        del %TEMP%\%2-22.png
        del %TEMP%\%2-32.png
        del %TEMP%\%2.xml
    ) else (
        move %TEMP%\%2-22.png .
        move %TEMP%\%2-32.png .
        move %TEMP%\%2.xml .
    )

    goto :eof

:usage

    echo.
    echo Usage: doicon ^<source files^> ^<destination name^>
    echo.
    echo e.g.   doicon source\*.png MyTestIcons
    echo.


