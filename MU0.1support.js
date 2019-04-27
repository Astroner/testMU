;(function(){
//Запечатал всё в модуль.
var loadedComponents = [],//Массив с загруженными компонентами
	//объект с именами загруженных компонентов
	loadedComponentList = {
		state: [],//Непосредственно элементы
		subscribers: [],//Массив с подписками
		//Функция для добавления элементов
		add: function (name) {
			var self = this;
			this.state.push(name);
			this.subscribers.forEach(function(elem) {
				elem(name, self.getState())
			});
		},
		//Получить state
		getState: function () {
			return this.state.slice(0);
		},
		//Метод для подписки
		subscribe: function (callback) {
			if (typeof(callback)==="function") {
				this.subscribers.push(callback)
			}
		},
	}
function asyncComponent (params){//Функция для асинхронного получения компонента по пути.
	var way = params.way,//путь
		data = params.data,//ДАта, переданная как объект
		result, style, script, oldScript, block,//Технические
		buffer = document.createElement('div'),//буфер для перегона
		callback = params.success,//Колбек, в который передастся скомпилированный объект
		send = params.send,//Узлы, которые передаются в send
		req = new XMLHttpRequest();//ajax<3
	if (typeof(callback)!=="function") {
		console.error("Callback should be defined");
		return document.createElement("div");
	}
	req.onerror = function (e) {//При ошибке
		console.error(e);
	}
	req.onload = function () {//При успехе
		result = this.responseText;//Текстовый вариант ответа
		if (data!==undefined) {//Если есть дата, то делает замены
			result = insertData(data, result);//Функция для вставки
		}
		buffer.innerHTML = result;//Вставляем в буфер ответ
		style = buffer.querySelector('style');//Находим стили
		oldScript = buffer.querySelector('script');//Находим скрипт
		if (oldScript!==null&&oldScript!==undefined) {//Если скрипт есть, то делаем его рабочим
			script = document.createElement('script');
			script.innerHTML = oldScript.innerHTML;
		}
		block = buffer.querySelector(':not(style):not(script');//Находим непостредственно блок
		if (block.getElementsByTagName('send').length>0&&send!==undefined&&typeof(send)=="object"&&send.length>0) {//Если есть блок send в компоненте
			var target = block.getElementsByTagName('send')[0];//Первый блок send в компоненте
			send.forEach(function(elem) {//Вставляем в него всё из send
				target.parentElement.insertBefore(elem, target);
			});
		}
		style!==null&&style!==undefined ? block.appendChild(style) : '';//Вставляем в него стиль
		script!==undefined ? block.appendChild(script) : '';//И скрипт
		callback(block);//Отправляем результат в callback
	}
	req.open("post", way);//Путь для запроса
	req.send();//Отсылаем запрос
}
//Функция для вставки дата
function insertData(data, res) {
	var result = res.slice(0),
		logic,
		body;
	//Если части с логикой нет, то просто делаем замену
	if (result.search(">>logic")==-1) {
		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				result = result.replace(new RegExp("#"+key,"g"), data[key]);
			}
		}
		return result
	}else{
		body = result.split(">>logic")[0];//Если логика есть, то сплитим документ на логику и тело
		logic = result.split(">>logic")[1];
		var buffer = document.createElement('div');//Создаём буфер
		buffer.innerHTML = logic;//Вставляем в него логику
		for (var key in data) {//Проходимся по всей дате
			if (data.hasOwnProperty(key)) {
				//Ищем блок логики для данного key и в нём ищем блок с его значением
				if (buffer.getElementsByTagName('var:'+key).length>0&&buffer.getElementsByTagName('var:'+key)[0].getElementsByTagName('case:'+data[key]).length>0) {
					//Если нашли, то cas = внутренности блока со значением для data[key]
					var cas = buffer.getElementsByTagName('var:'+key)[0].getElementsByTagName('case:'+data[key])[0].innerHTML;
					//Заменяем {data} на значение data[key]
					cas = cas.replace(new RegExp("{data}","g"),data[key]);
					//Проводим финальную замену
					body = body.replace(new RegExp("#"+key,"g"), cas);
				//Если к данному значению key нет блока с логикой, то ищем дефолтный
				}else if(buffer.getElementsByTagName('var:'+key).length>0&&buffer.getElementsByTagName('var:'+key)[0].getElementsByTagName('default').length>0){
					var def = buffer.getElementsByTagName('var:'+key)[0].getElementsByTagName('default')[0].innerHTML;
					def = def.replace(new RegExp("{data}","g"),data[key]);
					body = body.replace(new RegExp("#"+key,"g"), def);
				//Если нет и дефолтного блока, то просто проводим замену
				}else{
					body = body.replace(new RegExp("#"+key,"g"), data[key]);
				}
			}
		}
		return body
	}
}
//Загрузить компонент и поместить в loadedComponents
function loadComp(params) {
	var name = params.name,//Имя компонента
		way = params.way,//Путь до компонента
		success = params.success,//Callback в случае успеха
		req = new XMLHttpRequest();//ajax<3
	if (!name) {//Если не создано имя то возврат
		console.error("Name is not defined");
		return
	}
	if (!way) {//То же для пути
		console.error("Way is not defined");
		return
	}
	req.onload = function(){//Что делать при успешной загрузке
		var res = this.responseText,//Результат
			body,//тело
			logic,//логика
			buffer = document.createElement('div');//буфер
		if (loadedComponentList.state.indexOf(name)!==-1) {//Проверяем, есть ли компонент с подобным именем
			console.error("The component named \"" + name + "\" is already loaded!");
			return
		}
		if (res.search(">>logic")>=0) {//если еть модули логики
			body = res.split(">>logic")[0];//тело
			logic = res.split(">>logic")[1];//логика
			var log = {};//объект для записи логики
			buffer.innerHTML = logic;//Всавляем логику в буфер
			for (var key in buffer.children) {//перебираем все элементы
				if (buffer.children.hasOwnProperty(key)) {
					log[buffer.children[key].localName.slice(4)] = {};//создаём свойство для данной var
					var ches = buffer.children[key].children;//все case'ы
					for (var kes in ches) {//Перебираем все case'ы и default
						if (ches.hasOwnProperty(kes)) {
							var locName = ches[kes].localName;//Локальное имя
							if (locName!=="default") {//если не равно default
								locName = locName.slice(5);//То срезаем case:
							}
							//Создаём свойство curent case'a в данной var с текстом 
							log[buffer.children[key].localName.slice(4)][locName] = ches[kes].innerHTML;
						}
					}
				}
			}
			//Закидываем в массив по имени body - тело компонента(string) и logic - логику(объект)
			loadedComponents[name] = {
				body:body,
				logic: log
			};
		}else{
			//Если логики нет, то просто закидываем res
			loadedComponents[name] = {
				body: res
			}
		}
		loadedComponentList.add(name);//Добавляем name в массив загруженных компонентов
		//Выполняем callback
		if (success!==undefined) {
			success(res);
		}
	}
	//метод и путь
	req.open("post",way);
	//отправка
	req.send();
}
//Возвращает скомпилированный компонент, загруженный с помощью loadComp()
function loadedComp(params) {
	var name = params.name,//Имя компонента
		data = params.data,//переданная data
		send = params.send,//массив send
		buffer = document.createElement('div'),//буфер
		body, logic, style, block, oldScr, script;
	if(!loadedComponents[name]){//Проверка на наличие загруженного компонента
		console.error("Component "+name+" is not loaded");
		return document.createElement('div');
	}
	body = loadedComponents[name].body.slice(0);
	logic = loadedComponents[name].logic;
	if (data) {
		for (var key in data) {
		if (data.hasOwnProperty(key)) {
			if (!logic) {
				body = body.replace(new RegExp("#"+key,"g"), data[key])
			}else{
				if (logic[key]&&logic[key][data[key]]) {
					var res = logic[key][data[key]].slice(0);
					res = res.replace(new RegExp("{data}","g"), data[key]);
					body = body.replace(new RegExp("#"+key,"g"), res);
				}else if(logic[key]&&logic[key]["default"]){
					var res = logic[key]["default"].slice(0);
					res = res.replace(new RegExp("{data}","g"), data[key]);
					body = body.replace(new RegExp("#"+key,"g"), res);
				}else{
					body = body.replace(new RegExp("#"+key,"g"), data[key]);
				}
			}
		}
		}
	}
	buffer.innerHTML = body;
	block = buffer.querySelector(':not(style):not(script)');
	oldScr = buffer.querySelector('script');
	style = buffer.querySelector('style');
	if (oldScr) {
		script = document.createElement('script');
		script.innerHTML = oldScr.innerHTML;
	}
	if (block.getElementsByTagName('send').length>0) {
		var aim = block.getElementsByTagName('send')[0];
		if (send) {
			send.forEach(function(elem) {
				aim.parentElement.insertBefore(elem, aim);
			});
		}
		try{
			aim.remove()
		}catch(e){
			delete aim
		}
	}
	if (script) {
		block.appendChild(script);
	}
	if (style) {
		block.appendChild(style);
	}
	return block;
}
function createComp(prop) {
	var block = prop.block,
		style = prop.style,
		script = prop.script;
	if (block.tag===undefined) {
		console.error("tag should be defined!");
		return
	}
	var Block = document.createElement(block.tag);
	if (block.id!=undefined) {
		Block.id = block.id;
	}
	if (block.class!=undefined) {
		block.class.forEach(function(elem) {
			Block.classList.add(elem)
		});
	}
	if (block.handlers) {
		for (var key in block.handlers) {
			if (block.handlers.hasOwnProperty(key)) {
				Block["on"+key] = block.handlers[key];
			}
		}
	}
	if (block.childNodes) {
		block.childNodes.forEach(function(elem) {
			if (typeof(elem)=="string") {
				Block.innerHTML+=elem;
			}
		});
	}
	if (style) {
		var Style = document.createElement("style");
		style.forEach(function(elem) {
			Style.innerHTML+=elem.sel+"{"+"background:"+elem.rules.background+"}";
		});
		Block.appendChild(Style)
	}
	return Block;
}
//Порт для loadedComponentList.subscribe
function subs(callback) {
	loadedComponentList.subscribe(callback);
}
//Порт для loadedComponentList.getState
function getList() {
	return loadedComponentList.getState();
}
//Порт, чтобы загружать несколько компонентов за раз
function loadCompPort() {
	for (var i = 0; i < arguments.length; i++) {
		loadComp(arguments[i]);
	}
}
//API модуля
	window.msup = {
		//Загрузить компонент асинхронно и выполнить callback, в который аргументом скомпилированный компонент
		asyncComp:asyncComponent,
		loadComp:loadCompPort,//Загрузить компонент(ы) для будущего использования
		loadedComp:loadedComp,//Возвращает скомпилированный компонент, загруженный с помощью loadComp()
		getList: getList,//Возвращает массив с именами загруженных компонентов
		subscribe: subs,//Подписаться на изменения листа компонентов
		createComp:createComp
	}
}());