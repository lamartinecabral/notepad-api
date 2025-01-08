# nopedat

using Node.js
```javascript
// GET example to read a note
const noteId = 'note_id'
fetch('https://nopedat.netlify.app/api/?id='+noteId)
  .then(res=>res.text()).then(console.log);

// POST example to write a note
const newText = 'new_text'
fetch('https://nopedat.netlify.app/api/?id='+noteId, {
  method: 'POST',
  body: newText,
}).then(res=>res.text()).then(console.log);
```

using bash
```sh
# GET example to read a note
noteId='note_id'
response=$(curl 'https://nopedat.netlify.app/api/?id='$noteId)
echo $response

# POST example to write a note
newText='new_text'
response=$(curl -d $newText 'https://nopedat.netlify.app/api/?id='$noteId)
echo $response
```