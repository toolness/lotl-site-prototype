import xml.etree.ElementTree as ET

ITEM_OPEN_TAG = '''<?xml version="1.0" encoding="UTF-8" ?><item\
    xmlns:excerpt="excerpt"\
    xmlns:content="content"\
    xmlns:wfw="wfw"\
    xmlns:dc="dc"\
    xmlns:wp="wp">\
'''

class Post(object):
    def __init__(self, root):
        self.title = root.find('title').text
        self.link = root.find('link').text
        self.content = root.find('{content}encoded').text
        self.excerpt = root.find('{excerpt}encoded').text
        self.author = root.find('{dc}creator').text
        self.post_id = int(root.find('{wp}post_id').text)
        self.post_type = root.find('{wp}post_type').text
        self.status = root.find('{wp}status').text
        self.categories = []
        self.tags = []
        self.enclosure = None
        if root.find('{wp}attachment_url') is not None:
            self.attachment_url = root.find('{wp}attachment_url').text
        for el in root.findall('category'):
            if el.attrib['domain'] == 'category':
                self.categories.append(el.text)
            elif el.attrib['domain'] == 'post_tag':
                self.tags.append(el.text)
        for el in root.findall('{wp}postmeta'):
            meta_key = el.find('{wp}meta_key').text
            if meta_key == 'author':
                self.author = el.find('{wp}meta_value').text
            elif meta_key == 'enclosure':
                self.enclosure = el.find('{wp}meta_value').text
            elif meta_key == '_thumbnail_id':
                self.thumbnail_id = el.find('{wp}meta_value').text

    def __str__(self):
        return '<Post %s>' % (self.link)

def parse_xml(f):
    currxml = []
    in_comment = False

    for line in f:
        if not currxml:
            if line.strip() == '<item>':
                currxml.append(ITEM_OPEN_TAG)
        else:
            if in_comment:
                if line.strip() == '</wp:comment>':
                    in_comment = False
            else:
                if line.strip() == '<wp:comment>':
                    in_comment = True
                    continue
                currxml.append(line)
                if line.strip() == '</item>':
                    yield Post(ET.fromstring('\n'.join(currxml)))
                    currxml = []

if __name__ == '__main__':
    import sys
    import json

    if len(sys.argv) < 2:
        print "usage: %s <wordpress-extended-rss-file>" % sys.argv[0]
        sys.exit(1)
    print json.dumps([
        post.__dict__
        for post in parse_xml(open(sys.argv[1]))
        if post.status == 'publish'
    ], sort_keys=True, indent=2)
