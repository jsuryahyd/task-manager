export function replaceWithCodeBlocks(e){
  console.log(document.getSelection())
  const pos = getCaretPosition(e.target)
  console.log(pos);

	if (
    e.inputType === "insertText" &&
    e.target.innerHTML.match(/`(.*?)`/g)?.length
  ) {
    // e.target.innerHTML = e.target.innerHTML.replace(
    //   /`(.*?)`/g,
    //   "<code>$1</code>"
    // );
    /**
     * @type {HTMLElement[]}
		 * @desc breadthFirst traversal of DOM tree
     */
    const elements = [e.target];
    let preventInfinite = 0;
    while (elements.length) {
      const current = elements.pop();
      if (current?.childNodes?.length) {
        elements.splice(0, 0, ...current?.childNodes);
      } else {
        // current.innerText = current?.innerText.replace(
        //   /`(.*?)`/g,
        //   "<code>$1</code>"
        // ); //todo: insert code node at that index.
      }
      if (current?.nodeType === 3) {//textnode
        // current.textContent = current.textContent?.replace(
        //     /`(.*?)`/g,
        //     "<code>$1</code>"
        //   );
        const matches = current.textContent.match(/`(.*?)`/g) || [];
        if (!matches.length) {
          continue;
        }
        const originalText = current.textContent;
        const delimiter = "__*task-master_delimiter*__";
        const newNodes = current.textContent
          .replace(/`(.*?)`/g, delimiter)
          .split(delimiter).map(str=>document.createTextNode(str));
        const codes = matches.map((match) => {
          const code = document.createElement("code");
          code.textContent = match.replace(/(^`|`$)/g, "");
          return code;
        });
        const parent = current.parentElement
				if(!parent) return
        parent?.removeChild(current);
        newNodes.forEach((n, idx) => {
          parent.appendChild(n);
          codes[idx] && parent?.appendChild(codes[idx]);
        });
         setTimeout(()=>{
          console.log(codes[codes.length-1])
        setCaret(codes[codes.length-1],1)
        parent?.insertAdjacentHTML('beforeend',`<span> </span>`)
       })
      // setCaret(e.target, pos[1])
      }
      preventInfinite++;
      if (preventInfinite > Math.pow(10, 5)) {
        break;
      }
    }
    // console.log(e.target);
  }
}

// node_walk: walk the element tree, stop when func(node) returns false
function node_walk(node, func) {
  var result = func(node);
  for(node = node.firstChild; result !== false && node; node = node.nextSibling)
    result = node_walk(node, func);
  return result;
};

// getCaretPosition: return [start, end] as offsets to elem.textContent that
//   correspond to the selected portion of text
//   (if start == end, caret is at given position and no text is selected)
function getCaretPosition(elem) {
  var sel = window.getSelection();
  var cum_length = [0, 0];

  if(sel.anchorNode == elem)
    cum_length = [sel.anchorOffset, sel.extentOffset];
  else {
    var nodes_to_find = [sel.anchorNode, sel.extentNode];
    if(!elem.contains(sel.anchorNode) || !elem.contains(sel.extentNode))
      return undefined;
    else {
      var found = [0,0];
      var i;
      node_walk(elem, function(node) {
        for(i = 0; i < 2; i++) {
          if(node == nodes_to_find[i]) {
            found[i] = true;
            if(found[i == 0 ? 1 : 0])
              return false; // all done
          }
        }

        if(node.textContent && !node.firstChild) {
          for(i = 0; i < 2; i++) {
            if(!found[i])
              cum_length[i] += node.textContent.length;
          }
        }
      });
      cum_length[0] += sel.anchorOffset;
      cum_length[1] += sel.extentOffset;
    }
  }
  if(cum_length[0] <= cum_length[1])
    return cum_length;
  return [cum_length[1], cum_length[0]];
}

function setCaret(el,offset) {
  var range = document.createRange()
  var sel = window.getSelection()
  if(!sel) return console.error('no sel')
  range.setStart(el, offset)
  range.collapse(true)
  
  sel.removeAllRanges()
  sel.addRange(range)
}

window.setCaret = setCaret