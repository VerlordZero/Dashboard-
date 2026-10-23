# Rebuilds admin-standalone.html (single file) from admin/*.
cfg=open('admin/firebase-config.js').read().replace('export const','const')
js=open('admin/app.js').read().replace("import { firebaseConfig, cloudinaryConfig } from './firebase-config.js';\n","")
html=open('admin/index.html').read()
html=html.replace('<link rel="stylesheet" href="styles.css">','<style>\n'+open('admin/styles.css').read()+'</style>')
html=html.replace('<script type="module" src="app.js"></script>','<script type="module">\n'+cfg+js+'</script>')
open('admin-standalone.html','w').write(html)
