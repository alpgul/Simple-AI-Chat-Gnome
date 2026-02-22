#!/bin/bash

    reffile=penguin-ai-chatbot.pot
    xgettext --from-code=UTF-8 --output=../po/"$reffile" ../*.js  ../lib/*.js ../schemas/*.xml
    cd ../po
    for pofile in *.po
      do
        echo "Updating: $pofile"
        msgmerge --backup=off -N -U "$pofile" "$reffile"
        msgattrib --no-obsolete -o "$pofile" "$pofile"
      done
    echo "Done."