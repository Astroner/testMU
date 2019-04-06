;'use strict';
let __way = './',//def way
	__mode = 'def',//def mode
	__groups = [],//groups
	__snippets = [],//snippets
	__onload,//onload fun
	__patterns = [],//patterns
	__compression = "normal",//compression mode
	__allStyle = document.createElement('style');//this is the block with all styles

//it returns full leveled map of dom element
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

//support functions
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
//Make body extends pattern
getExtendedComp = (data, body, status)=>{
	if(!status){//Если статус false, то просто возвращаем body
		return body
	}
	if (body.search(">>logic")==-1) {//Если не находится часть >>logic, то просто всё заменяем
		let result = body.slice(0);
		for (let i in data) {
			if (data.hasOwnProperty(i)) {
				let reg = new RegExp("#"+i,"g");
				result = result.replace(reg, data[i]);
			}
		}
		return result
	}else{//Если logic есть
		let logic,//часть с логикой
			buffer;//часть с body
		[body, logic] = body.split(">>logic");//Сплитим всё по >>logic
		buffer = document.createElement('div');//Создаём buffer
		buffer.innerHTML = logic;//Вставляем в него logic
		for (let i in data) {//Проходимся по всей data
			if (data.hasOwnProperty(i)) {
				let reg = new RegExp("#"+i,"g");//рег для финальной замены
				if (buffer.getElementsByTagName('var:'+i).length>0&&buffer.getElementsByTagName('var:'+i)[0].getElementsByTagName('case:'+data[i]).length>0) {
					//Если существует блок логики для данного ключа и для данного конкретного кейса, то
					//resultier - текст для кейса.
					let resulier = buffer.getElementsByTagName('var:'+i)[0].getElementsByTagName('case:'+data[i])[0].innerHTML,
						reg1 = new RegExp("\{data\}","g");//рег для замены в resulier конструкции {data} на значение ключа
					resulier = resulier.replace(reg1, data[i]);//Заменяем {data} на значение ключа
					body = body.replace(reg, resulier);//Финальная замена
				}else if (buffer.getElementsByTagName('var:'+i).length>0&&buffer.getElementsByTagName('var:'+i)[0].getElementsByTagName("default").length>0) {
					let def = buffer.getElementsByTagName('var:'+i)[0].getElementsByTagName("default")[0].innerHTML,
						reg1 = new RegExp("\{data\}","g");//рег для замены в def конструкции {data} на значение ключа
					def = def.replace(reg1, data[i]);//Заменяем {data} на значение ключа
					body = body.replace(reg, def);//Финальная замена
				}else{//Если отсутствует блок логики или кейс или default, то просто делаем замену
					body = body.replace(reg, data[i]);
				}
			}
		}
		return body;//Финально возвращаем body
	}
},
//For inserting snippets
insertSnippets = code=>{
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
//Вствляет отправленный send
insertSendedElements = (name, group, block)=>{
	let aimElem = getAim(name,group).getElementsByTagName('send'),//Получаю send из марки
		send = block.getElementsByTagName('send')[0],//получаю send из компонента
		buffer = document.createElement('div'),//создаю буфер для копирования
		elems = [];//массив с ссылками на DOM
	if (aimElem.length===0) {//Если не находит send в марке, то ошибка
		log.error("sender is undefined in block \""+name+"\"");
		return
	}
	aimElem = aimElem[0];//если находит, то берём за корректный буфер - первый
	buffer.innerHTML = aimElem.innerHTML;//Копируем всё в буфер
	for (let key in buffer.childNodes) {//Бурём ссылки на элементы в массив
		if (buffer.childNodes.hasOwnProperty(key)) {
			elems.push(buffer.childNodes[key])
		}
	}
	elems.forEach(elem=> {//Переносим всё из буфера в сам блок
		send.parentElement.insertBefore(elem, send);
	});
	send.remove();
},
//Всавляет в конец outerHTML(text) script.outerHTML
insertScriptInBlock = (name, text, script)=>{
	//ищем закрывающий блок элемента, разрезаем строку на до него и самого него, вставляем скрипт между
	text = text.slice(0, text.lastIndexOf("</"+name+">")) + script + text.slice(text.lastIndexOf("</"+name+">"), text.length);
	return text;
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
async function parse(params){
	//Если параметр строка, то делаем fetch по адресу для получения json данных и преобразуем params в объект
	if (typeof params === 'string') {
		if (params.slice(0,2)!=='./'||params.slice(-5)!=='.json'){
			log.error('Wrong way to json file');
			return
		}
		await fetch(params)
				.then(response=>response.json(), e=>console.error('there is problem: ' + e))
				.then(res=>{params = res});
	}
	//Если params - объект, то производит фиксы основных компонентов программы
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
	//Получаем все MU компоненты в массив muComp
	new nodeMap(document.body).forEach(elem=> {
		let prepComp = getMUcomponent(elem.body, elem.lvl);
		prepComp!==undefined ? muComp.push(prepComp) : '';
	});
	//Делаем запрос на сервер за всеми компонентами и помещаем массив с компонентами и некоторой инфой в requestedComp
	for (let i = 0; i < muComp.length; i++) {
		await getFetch(muComp[i], requestedComp, muComp.length);
	}
	//Прередаём управление activeParse в неё отправляем запрошенные компоненты
	activeParse(requestedComp);
}
export default parse;


//MAIN func that work with prepared components
function activeParse(result) {
	let components = [],
		maxLvl
	//Отсеиваем все ошибочные запросы. Верные записываем в components
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
	//из строки делаем DOM и блок+стили закидываем в comp.body, а скрипт закидываем в comp.script 
	components.forEach(comp=> {
		[comp.body, comp.script] = compileObject(comp.body, comp.name, comp.group);
	});
	//Если мод get, то кампилируем текстовый вариант итогового body
	if (__mode==='get') {
		textOutput({coms: components, state: document.body.outerHTML, max: maxLvl});
	}
	insertInDOM(components, maxLvl);//Вставляем всё в body
	__onload!==undefined ? document.body.appendChild(__onload) : '';//Если есть onload функция, то исполняет её
	log.show();//Показывает лог
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
	//По порядку, т.е. как они идут в коде вставляем script блоки!
	components.forEach(({script})=>{
		if (script=="noScript") {
			return
		}
		document.body.appendChild(script);
	});
	//Вставляем стили
	document.body.appendChild(__allStyle);
}




//Compile text into DOM element
function compileObject(component, name, group) {
	let buffer = document.createElement('div');
	buffer.style.display = 'none';
	buffer.innerHTML = component;
	document.body.appendChild(buffer);

	let style = buffer.getElementsByTagName('style')[0]||'noStyle',
		script = getScript(buffer),
		block,
		finalScript;

	block = buffer.querySelector(':not(style):not(script)');

	if (block.getElementsByTagName('send').length!==0) {
		insertSendedElements(name, group, block);//Если в компонент что-то посылается, то вставляем это
	}

	if (style!=='noStyle'&&style.getAttribute('scoped')!==null) {
		[block, style] = getScopedAll({block: block, style: style, name: name, group: group});
		style.removeAttribute('scoped');
	}

	style!=='noStyle' ? __allStyle.innerHTML+=style.innerHTML : '';
	finalScript = (script!=='noScript'&&script.innerHTML.replace(/\n/g,'')!='' ? script : 'noScript');
	buffer.remove();
	return [block, finalScript];
}



//Get all MU comp from document as object with 5 params : name of component, level in map, way, if it is, group, if it is and extends if it is
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
}


//create text output
function textOutput({coms, state, max}){
	for (let i = 1; i <=max; i++) {//step by step it goes every level
		let curLvl = [];	  
		coms.forEach(elem=>{	 	  //
			if (elem.lvl == i) {	  //choosing elements
				curLvl.push(elem);	  //
			}
		});
		curLvl.forEach(elem=> {//inserting
			let aim = getAim(elem.name, elem.group).outerHTML;//getting aim
			if (aim==undefined) {
				return
			}
			let tblock = elem.body.outerHTML.slice(0);
			//Если есть скрипт блок, то вставляем его
			tblock = (elem.script!=="noScript" ? insertScriptInBlock(elem.body.localName, tblock, elem.script.outerHTML) : tblock);
			aim!==undefined ? state = state.replace(aim, tblock) : '';
		});
	}
	state = state.replace(/<script type="module"(.|\n)*?<\/script>/g, '');
	if (__compression=='normal') {
		state = state.replace(/\n/g,'');
		state = state.replace(/<!--.+-->/g,'');
		state = state.replace(/>\s</g,'><');
	}
	__onload!==undefined ? state = state.replace(/<body/,'<body onload = "'+__onload.innerHTML+'"') : '';
	//Вставляем стили в конце всего.
	state = state.replace("</body>", __allStyle.outerHTML+"</body>");
	log.code(state);
}