'use strict';
let __way = './',
	__mode = 'def',
	__groups = [],
	__snippets = [],
	__onload,
	__patterns = [],
	__compression = "normal";

export const nodeMap = class{
	constructor(node){
		this.finale = [];
		if (node.children.length!==0) {
			for (let i = 0; i < node.children.length; i++) {
				this.getThen(node.children[i], 0);
			}
		}
		return this.finale;
	}
	getThen(arg, parlvl){
		if (arg.localName==='script'||arg.localName==='style') {
			return
		}
		this.finale.push({body: arg, lvl: parlvl+1});
		let leng = arg.children||"noC";
		if (leng!=="noC") {
			for (let i = 0; i < arg.children.length; i++) {
				this.getThen(arg.children[i], parlvl+1);
			}
		}
	}
}

const 
// check of new way
fixWay = (newWay, oldWay)=>{
	if(newWay===undefined){
		log.error('wrong default way');
		return oldWay;
	}
	if (newWay.slice(0,2)==='./'&&newWay.slice(-1)==='/') {
		return newWay;
	}
}, 
//check of new Mode
fixMode = (newMode, oldMode)=>{
	if (newMode==='get'||newMode==='def') {
		return newMode;
	}else{
		log.error('wrong default mode(it can be only "def" of "get")');
		return oldMode;
	}
},
//fix groups)
fixGroups = groups=>{
	let result = [];
	for(let key in groups){
		if (groups[key].slice(0,2)==='./'&&groups[key].slice(-1)==='/') {
			result[key] = groups[key];
		}else{
			log.error('Wrong way in group \'' + key + '\'');
		}
	}
	return result
},
//It's fixing snippets
fixSnippets = snippets=>{
	let result = [];
	if (snippets==undefined) {
		return [];
	}
	for (let i in snippets) {
		if (snippets.hasOwnProperty(i)) {
			result[i] = snippets[i];
		}
	}
	return result;
},
//it's fixing patterns
fixPatterns = patterns=>{
	let result = [];
	if (patterns==undefined) {
		return [];
	}
	for (let i in patterns) {
		if (patterns.hasOwnProperty(i)) {
			if ((patterns[i].slice(0,2)==='./'||patterns[i].slice(0,3)==='../')&&patterns[i].slice(-3)==='.mu') {
				result[i] = patterns[i];
			}else{
				log.error("wrong way on pattern " + i);
			}
		}
	}
	return result
},
//getting aim for inserting
getAim = (name, group)=>{
	let result,
		allElems = document.getElementsByTagName('MU:' + name);
	for (let i = 0; i < allElems.length; i++) {
		if (allElems[i].getAttribute('group')==group) {
			result = allElems[i];
			i = allElems.length;
		}
	}
	return result
},
//getting script
getScript = buffer=>{
	let result = document.createElement('script'),
		block = buffer.getElementsByTagName('script')[0]||'noScript';
	if (block == 'noScript') {
		return block;
	}
	result.innerHTML = getParsedJS(block.textContent);

	return result;
},
//Parse custom code in js code
getParsedJS = code=>{
	return insertSnippets(code);
},
//Making new Scoped style module
getCommonStyle = (rule, name)=>{
	return rule.selectorText +'[data-mu-name = "'+name+'"]' + "{" + rule.cssText.split('{')[1];
},
getMediaScoped = (rule, name)=>{
	let result = "@media "+rule.conditionText + '{';
	for (let i in rule.cssRules) {
		if (rule.cssRules.hasOwnProperty(i)) {
			result+=getCommonStyle(rule.cssRules[i], name);
		}
	}
	return result+"}";
},
//Scope styles
getScopedAll = ({block, style, name, group})=>{
	let fullName = name+(group!==undefined ? '_'+group : ''),
		newStyle = "",
		rules = style.sheet.cssRules,
		map = new nodeMap(block);
	block.dataset.muName = fullName;
	map.forEach(elem=> {
		elem.body.localName.slice(0,3)!='mu:' ? elem.body.dataset.muName = fullName : '';
	});
	/*for (let key in block.children) {
		if (block.children.hasOwnProperty(key)) {
			block.children[key].localName.slice(0,3)!='mu:' ? block.children[key].dataset.muName = fullName : '';
		}
	}*/
	for (let key in rules) {
		if (rules.hasOwnProperty(key)) {
			newStyle+=
				(rules[key].selectorText!==undefined ? getCommonStyle(rules[key], fullName) : '')+
				(rules[key].name!==undefined ? rules[key].cssText : '')+
				(rules[key].conditionText!==undefined ? getMediaScoped(rules[key], fullName) : '')+
				(rules[key].href!==undefined ? rules[key].cssText : '')+
				(rules[key].cssText.slice(0,10)=='@font-face' ? rules[key].cssText : '')
		}
	}
	style.innerHTML = newStyle;
	return [block, style]
},
//getting TextAim for mode = get
getTextAim = ({name, group, state})=>{
	let aim = new RegExp('<mu:'+name+(group!==undefined ? '.+group.+"'+group+'"' : '')+'.*>(.|\n)*?</mu:'+name+'>','g');
	return (state.match(aim)!==undefined&&state.match(aim)!==null ? state.match(aim)[0] : undefined);
},
//Make body extends pattern
getExtendedComp = (data, body, status)=>{
	if(!status){
		return body
	}
	let result = body.slice(0);
	for (let i in data) {
		if (data.hasOwnProperty(i)) {
			let reg = new RegExp("#"+i,"g");
			result = result.replace(reg, data[i]);
		}
	}
	return result
},
//For inserting snippets
insertSnippets = (code)=>{
	for (let i in __snippets) {
		if (__snippets.hasOwnProperty(i)) {
			let reg = new RegExp('!'+i+'!','g');
			code = code.replace(reg, __snippets[i]);
		}
	}
	return code;
},
//Onload function
fixOnload = txt=>{
	if (txt == undefined) {
		return txt;
	}
	if (typeof(txt)!='string'||txt == '') {
		log.error("Wrong onload param");
		return txt
	}
	let scr = document.createElement('script');
	scr.innerHTML = txt;
	return scr;
},
//Fix Compression
fixCompression = (nw, old)=>{
	if (nw===undefined) {
		return old
	}
	if(typeof(nw)!=="string"){
		log.error("invalid compression value type");
		return old
	}
	if (nw==="normal"||nw==="none") {
		return nw
	}else{
		log.error("Wrong compression type "+nw);
		return old
	}
},
//Logger for MU
log = {
	messages: [],
	error(text){
		let body = document.createElement('div');
		body.style.color = '#D62C2C';
		body.style.fontFamily = 'inherit';
		body.style.fontSize = '1.5rem';
		body.innerHTML = 'ERROR: ' + text;
		this.messages.push(body);
	},
	message(text){
		let body = document.createElement('div');
		body.style.color = '#4E74D3';
		body.style.fontFamily = 'inherit';
		body.style.fontSize = '1.5rem';
		body.innerHTML = 'Message: ' + text;
		this.messages.push(body);
	},
	show(){
		if (this.messages.length==0) {
			return
		}
		let cmd = document.createElement('div'),
			redButton = document.createElement('div');
		cmd.style = 'width:100vw; height: 100vh; background: rgba(0,0,0,.8); position: fixed; top: 0; left: 0; color: white; font-family: Calibri; overflow-y: scroll';
		redButton.style = "width: 100%; text-align: center; background: #E62121; font-size: 2rem; font-family:inherit; cursor: pointer;box-shadow:0px 3px 0px 0px #B62929";
		redButton.innerHTML = 'Закрыть';
		redButton.onclick = function(){
			this.parentElement.remove();
		}
		cmd.appendChild(redButton);
		this.messages.forEach(i=> {
			cmd.appendChild(i);
		});
		document.body.appendChild(cmd);		
	},
	code(text){
		this.message('Compiled!<hr>');
		let body = document.createElement('div');
		body.style.color = '#F3F3F3';
		body.style.fontFamily = 'inherit';
		body.style.fontSize = '1rem';
		body.innerText = text;
		this.messages.push(body);
	}
}
/*,timer = ()=>{
	time++;
	window.requestAnimationFrame(timer);
}
let time = 0;*/
//func for initialize parse and for preparation of MU components
export const parse = async function(params){
	if (typeof params === 'string') {
		if (params.slice(0,2)!=='./'||params.slice(-5)!=='.json'){
			log.error('Wrong way to json file');
			return
		}
		await fetch(params)
				.then(response=>response.json(), e=>console.error('there is problem: ' + e))
				.then(res=>{params = res});
	}

	if (typeof params === 'object') {
		__way = fixWay(params.way, __way);
		__mode = fixMode(params.mode, __mode);
		__groups = fixGroups(params.groups);
		__snippets = fixSnippets(params.snippets);
		__onload = fixOnload(params.onload);
		__patterns = fixPatterns(params.patterns);
		__compression = fixCompression(params.compression, __compression);
	}
	let muComp = [],
		requestedComp = [];
	new nodeMap(document.body).forEach(elem=> {
		muComp.push(getMUcomponent(elem.body, elem.lvl));
	});
	muComp.forEach(comp=> {
		getFetch(comp, requestedComp, muComp.length);
	});
}




//MAIN func that work with prepared components
function activeParse(result) {
	let components = [],
		maxLvl
	result.forEach(i=> {
		if (i!=='error') {
			let nc = {};
			maxLvl<i.lvl||maxLvl==undefined ? maxLvl = i.lvl : '';
			for(let j in i){
				nc[j] = i[j];
			}
			components.push(nc);
		}
	});
	components.forEach(comp=> {
		comp.body = compileObject(comp.body, comp.name, comp.group);
	});
	if (__mode==='get') {
		textOutput({coms: components, state: document.body.outerHTML, max: maxLvl});
	}
	insertInDOM(components, maxLvl);
	__onload!==undefined ? document.body.appendChild(__onload) : '';
	log.show();
}




//Inserts components in DOM by level
function insertInDOM(components, maxLvl) {
	for (let i = 1; i <=maxLvl; i++) {//step by step it goes every level
		let curLvl = [];			  
		components.forEach(elem=>{	  //
			if (elem.lvl == i) {	  //choosing elements
				curLvl.push(elem);	  //
			}
		});
		curLvl.forEach(elem=> {//inserting
			let aim = getAim(elem.name, elem.group);//getting aim
			if (aim==undefined) {
				return
			}
			aim.parentElement.insertBefore(elem.body, aim);
			aim.remove();
		});
	}
}




//Compile text into DOM element
function compileObject(component, name, group) {
	let buffer = document.createElement('div');
	buffer.style.display = 'none';
	buffer.innerHTML = component;
	document.body.appendChild(buffer);

	let style = buffer.getElementsByTagName('style')[0]||'noStyle',
		script = getScript(buffer),
		block;

	for (let i = 0; i < buffer.children.length; i++) {
		if (buffer.children[i].localName!=='style'&&buffer.children[i].localName!=='script') {
			block = buffer.children[i];
			i = buffer.children.length;
		}
	}

	if (style!=='noStyle'&&style.getAttribute('scoped')!==null) {
		[block, style] = getScopedAll({block: block, style: style, name: name, group: group});
		style.removeAttribute('scoped');
	}

	style!=='noStyle' ? block.appendChild(style) : '';
	script!=='noScript'&&script.innerHTML.replace(/\n/g,'')!='' ? block.appendChild(script) : '';
	buffer.remove();
	return block;
}






//Get all MU comp from document as object with 3 params : name of component, level in map and way, if it is
function getMUcomponent(node, lvl, muComp) {
	if(node.localName.search(/mu:/)===(-1)){
		return
	}
	return {
		name: node.localName.slice(3),
		nodeLvl: lvl,
		way: (node.getAttribute('way')!==null ? node.getAttribute('way') : "noWay"),
		group: (node.getAttribute('group')!==null ? node.getAttribute('group') : "noGroup"),
		extends: (node.getAttribute('extends')!==null ? {name: node.getAttribute('extends'), data: node.getAttribute('MUdata')} : "noExtends"),
	}
}



//Fetch request to server with simple check 
async function getFetch(comp, requestedComp, length) {
	let response,
		adress = __way + comp.name + '.mu',
		status = true;
	//Обработка адреса
	if (comp.extends!=="noExtends"&&comp.extends.name!=="self") {
		if (__patterns[comp.extends.name]!==undefined) {
			adress = __patterns[comp.extends.name];
		}else{
			log.error("Unknown group on component \"" + comp.name + "\"");
			status = false;
		}
	}else if(comp.group!=="noGroup"){
		adress = (__groups[comp.group]!==undefined ? __groups[comp.group] + comp.name + '.mu' : adress);
	}else if(comp.way!=="noWay"){
		adress = comp.way;
	}
	//Запрос
	await fetch(adress)
		.then(result=>result.ok == true ? result.text() : 'error', e=>console.error(e))
		.then(res=>{
			if (res!=='error') {
				response = {
					name: comp.name,
					body: comp.extends!=="noExtends" ? getExtendedComp(JSON.parse(comp.extends.data), res, status) : res,
					lvl: comp.nodeLvl,
				};
				comp.group!=='noGroup' ? response.group = comp.group : '';
				comp.extends!=='noExtends'&&status===true ? response.extends = comp.extends : '';
			}else{
				response = 'error';
			}
		})
	requestedComp.push(response);
	if (requestedComp.length == length) {
		activeParse(requestedComp);
	}
}
function textOutput({coms, state, max}){
	for (let i = 1; i <=max; i++) {//step by step it goes every level
		let curLvl = [];	  
		coms.forEach(elem=>{	 	  //
			if (elem.lvl == i) {	  //choosing elements
				curLvl.push(elem);	  //
			}
		});
		curLvl.forEach(elem=> {//inserting
			let aim = new RegExp(getTextAim({name: elem.name, group: elem.group, state: state}));//getting aim
			if (aim==undefined) {
				return
			}
			aim!==undefined ? state = state.replace(aim, elem.body.outerHTML) : '';
		});
	}
	state = state.replace(/<script type="module"(.|\n)*?<\/script>/g, '');
	if (__compression=='normal') {
		state = state.replace(/\n/g,'');
		state = state.replace(/<!--.+-->/g,'');
		state = state.replace(/>\s</g,'><');
	}
	__onload!==undefined ? state = state.replace(/<body/,'<body onload = "'+__onload.innerHTML+'"') : '';
	log.code(state);
}