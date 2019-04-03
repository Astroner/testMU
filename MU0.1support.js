;(function(){
//Запечатал всё в модуль.
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
//API модуля
	window.msup = {
		asyncComponent:asyncComponent
	}
}());