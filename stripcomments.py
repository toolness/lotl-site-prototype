'''
    This script just takes the Wordpress Extended RSS file (specified
    in the command-line) and outputs it with its comments stripped out.

    Useful if you need to make a duplicate of a site without a ton of
    spam comments in it.
'''

import sys

f = open(sys.argv[1])
in_comment = False
for line in f:
    if in_comment:
        if line.strip() == '</wp:comment>':
            in_comment = False
    else:
        if line.strip() == '<wp:comment>':
            in_comment = True
            continue
        sys.stdout.write(line)
