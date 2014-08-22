import xml.etree.ElementTree as ET

ITEM_OPEN_TAG = '''<?xml version="1.0" encoding="UTF-8" ?><item\
    xmlns:excerpt="excerpt"\
    xmlns:content="content"\
    xmlns:wfw="wfw"\
    xmlns:dc="dc"\
    xmlns:wp="wp">\
'''

class Database(object):
    def __init__(self, f):
        self.posts_by_id = {}
        self.posts = []
        for post in self._parse_posts(f):
            self.posts.append(post)
            self.posts_by_id[post.post_id] = post

    def to_json(self):
        posts = []
        for post in self.posts:
            if post.post_type != 'post' or post.status != 'publish':
                continue
            pdict = {}
            pdict.update(post.__dict__)
            for key in ['post_type', 'status', 'post_id', 'content']:
                del pdict[key]
            if post.thumbnail_id is not None:
                thumbnail = self.posts_by_id[post.thumbnail_id]
                del pdict['thumbnail_id']
                pdict['thumbnail'] = thumbnail.attachment_url
            posts.append(pdict)

        return json.dumps(posts, sort_keys=True, indent=2)

    def _parse_posts(self, f):
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

class Post(object):
    def __init__(self, root):
        self.title = root.find('title').text
        self.link = root.find('link').text
        self.content = root.find('{content}encoded').text
        self.excerpt = root.find('{excerpt}encoded').text
        self.author = root.find('{dc}creator').text
        self.post_id = int(root.find('{wp}post_id').text)
        self.post_type = root.find('{wp}post_type').text
        self.pubdate = root.find('pubDate').text
        self.status = root.find('{wp}status').text
        self.categories = []
        self.tags = []
        self.enclosure = None
        self.thumbnail_id = None
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
                self.enclosure = el.find('{wp}meta_value').text\
                  .splitlines()[0]
            elif meta_key == '_thumbnail_id':
                self.thumbnail_id = int(el.find('{wp}meta_value').text)

    def __str__(self):
        return '<Post %s>' % (self.link)

if __name__ == '__main__':
    import sys
    import json

    if len(sys.argv) < 2:
        print "usage: %s <wordpress-extended-rss-file>" % sys.argv[0]
        sys.exit(1)
    db = Database(open(sys.argv[1]))
    f = open('posts.js', 'w')
    f.write('var POSTS = ')
    f.write(db.to_json())
    f.write(';')
    f.close()
    print "Wrote posts.js."
