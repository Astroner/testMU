function asyncComponent (params){//Функция для асинхронного получения компонента по пути.
	var way = params.way,//путь
		data = params.data,//ДАта, переданная как объект
		result, style, script, oldScript, block,//Технические
		buffer = document.createElement('div'),//буфер для перегона
		callback = params.success,//Колбек, в который передастся скомпилированный объект
		req = new XMLHttpRequest();//ajax<3
	req.onerror = function (e) {//При ошибке
		console.error(e);
	}
	req.onload = function () {//При успехе
		result = this.responseText;//Текстовый вариант ответа
		if (data!==undefined) {//Если есть дата, то делает замены
			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					result = result.replace(new RegExp("#"+key,"g"), data[key]);
				}
			}
		}
		buffer.innerHTML = result;//Вставляем в буфер ответ
		style = buffer.querySelector('style');//Находим стили
		oldScript = buffer.querySelector('script');//Находим скрипт
		if (oldScript!==null&&oldScript!==undefined) {//Если скрипт есть, то делаем его рабочим
			script = document.createElement('script');
			script.innerHTML = oldScript.innerHTML;
		}
		block = buffer.querySelector(':not(style):not(script');//Находим непостредственно блок
		style!==null&&style!==undefined ? block.appendChild(style) : '';//Вставляем в него стиль
		script!==undefined ? block.appendChild(script) : '';//И скрипт
		callback(block);//Отправляем результат в callback
	}
	req.open("post", way);//Путь для запроса
	req.send();//Отсылаем запрос
}