spy();

var ELEMENT_HOVER_STYLE = "2px solid #f00";	//鼠标悬停样式
var mouseHoverElement;	//鼠标悬停元素
var infoDiv;	//findElement信息展示
var spy_flag=true;	//spy标记
var last_switch;	//记录上一次开关状态

var ATTR_FILTER;
var ATTR_VALUE_MAX_LENGTH;
//SPY 入口
function spy(){
	
	chrome.storage.local.get(function(rst){
		var isOn = rst["SWITCH_ON"] == undefined ? false : rst["SWITCH_ON"];
		var tmp = rst["ATTR_FILTER"] == undefined ? INIT_ATTR_FILTER : rst["ATTR_FILTER"];
		ATTR_FILTER = tmp.split(",");
		ATTR_VALUE_MAX_LENGTH = rst["ATTR_VALUE_MAX_LENGTH"] == undefined ? INIT_ATTR_VALUE_MAX_LENGTH : rst["ATTR_VALUE_MAX_LENGTH"];
		
		
		last_switch = isOn;
		if(isOn)
		{
			document.onkeyup = keyUp;
		    document.onmouseover = mouseOver;
		    document.onmouseout = mouseOut;
		    createInfoDiv();	//动态创建对象
		}else{
			document.onmouseout = mouseOut;
		}
		
	});
	
}

//mouseOver但不抓取对象信息
function mouseOverWOSpy(e) {
	hoverElement(e.target);
}


//mouseOver并抓取对象信息
function mouseOver(e) {
	hoverElement(e.target);
    infoDiv.style.display = 'block';
    updateInfoDiv(createPathFromElement(mouseHoverElement));
    mouseMoveLocation(e);
}

function mouseOut(e) {
	chrome.storage.local.get(function(rst){
		var isOn = rst["SWITCH_ON"] == undefined ? false : rst["SWITCH_ON"];
		var tmp = rst["ATTR_FILTER"] == undefined ? INIT_ATTR_FILTER : rst["ATTR_FILTER"];
		ATTR_FILTER = tmp.split(",");
		ATTR_VALUE_MAX_LENGTH = rst["ATTR_VALUE_MAX_LENGTH"] == undefined ? INIT_ATTR_VALUE_MAX_LENGTH : rst["ATTR_VALUE_MAX_LENGTH"];
		
		if(isOn != last_switch)	//只有开关做了变化，才触发
		{
			last_switch = isOn;
			if(isOn )
			{
				document.onkeyup = keyUp;
			    document.onmouseover = mouseOver;
			    document.onmouseout = mouseOut;
			    createInfoDiv();	//动态创建对象
			}else{
				
				document.onkeyup = null;
			    document.onmouseover = null;
			    if(!spy_flag){	// ` 被按下过,需要清除样式
			    	mouseHoverElement.style.outline = '';
			        infoDiv.style.display = 'none';
			        updateInfoDiv("");
			        mouseHoverElement = null;
			    }
			}
		}
		
	});
	
	if (mouseHoverElement != e.target || !spy_flag) {
        return;
    }
    mouseHoverElement.style.outline = '';
    infoDiv.style.display = 'none';
    updateInfoDiv("");
    mouseHoverElement = null;
    
    
}

//鼠标移动，infoDiv的位置变化
function mouseMoveLocation(e) {
	var y = 0;
    var windowHeight = $(window).height();

    if (e.clientY - infoDiv.offsetHeight - 20 < 0) {
        y = windowHeight - infoDiv.offsetHeight-20;
    }
    
    infoDiv.style.top = y + 'px';
}



function hoverElement(selectedElement){
    if (selectedElement.nodeName.toLowerCase() == 'iframe' || selectedElement.nodeName.toLowerCase() == 'frame') {
        var iframeContentWindow = selectedElement.contentWindow;
        if (iframeContentWindow) {
            iframeContentWindow.focus();
        }
    } else {
        var doc = selectedElement.ownerDocument;
        var win = doc.defaultView || doc.parentWindow;
        win.focus();
    }

    if (selectedElement == mouseHoverElement) {
        return;
    }
    if (mouseHoverElement != null) {
        mouseHoverElement.style.outline = '';
    }
    mouseHoverElement = selectedElement;
    mouseHoverElement.style.outline = ELEMENT_HOVER_STYLE;
}

function keyUp(e){
	var keyCode = document.all ? window.event.keyCode : event.keyCode;

	if(keyCode==192){	// ` 键192
		if(spy_flag){
			document.onmouseover = mouseOverWOSpy;
			spy_flag = false;
		}else{
			document.onmouseover = mouseOver;
			spy_flag = true;
		}
	}
	
	if(keyCode==38){	//up 键
		var parentEL = mouseHoverElement.parentNode;
		while(parentEL)
		{
			if(parentEL.nodeType==1){
				simulateMouseEvent(mouseHoverElement,"mouseout");
				simulateMouseEvent(parentEL,"mouseover");
				break;
			}
			parentEL=parentEL.parentNode;
		}
	}
}

//模拟mouse Over/out事件
function simulateMouseEvent(el,event) {  
	if(event=="mouseout"){document.onmouseover = mouseOver;document.onmouseout = null;}
	if(event=="mouseover"){document.onmouseover = mouseOver;document.onmouseout = mouseOut;}
	var evt;    
	if (document.createEvent) { // DOM Level 2 standard  
	    evt = document.createEvent("MouseEvents");    
	    evt.initMouseEvent(event, true, true, window,    
	      0, 0, 0, 0, 0, false, false, false, false, 0, null);    
	    el.dispatchEvent(evt);    
	} else if (el.fireEvent) { // IE  
	    el.fireEvent('on'+event);    
	}    
}

function updateInfoDiv(text) {
	$("#autotest").html(text);
}

//检查元素是否显示
function isDisplayed(el){
	if($(el).width()==0 || $(el).height()==0){//当前模块高度是0
		return false;
	}
	for(;el && el.nodeType==1; el = el.parentNode){//元素或父元素不显示
		if (el.style && (el.style.display == 'none' || el.style.visibility == 'hidden')) {
			return false;
		}
	}
	return true;
}

//检查是否唯一
function isUnique(els){
	var cnt = els.length;
	var found = 0;
	
	for (var i=0; i < cnt ; i++){
		if( isDisplayed(els[i]) ){
			found++;
			if(found > 1){
				return false;
			}
		}
	}
	return found==1?true:false;
}

    

//获取element路径
function createPathFromElement(element, isUnion, parentElement){
	var arrayAttrName = new Array();
	var arrayAttrValue = new Array();
	var tagName = element.nodeName.toLowerCase();
	var text = $(element).text();
	
	
	var attributes = element.attributes;

	for(var i=0; i<attributes.length; i++){
		var attr = attributes[i].name.toLowerCase();
		if(ATTR_FILTER.indexOf(attr) > -1){
			continue;	//过滤一些难以分辨的属性
		}
		
		var attr_value = attributes[i].value;
		if(attr_value && attr_value.length > ATTR_VALUE_MAX_LENGTH){
			continue;	//过滤属性值的长度
		}
//		if(attr_value && attr_value.indexOf("\"") >  -1){
//			attr_value = attr_value.replace(/\"/g,"'");
//		}
		
		arrayAttrName.push(attr);	//添加属性
		arrayAttrValue.push(attr_value);	//添加属性值
		
	}
	
	if(text && text.length > ATTR_VALUE_MAX_LENGTH){
		text="";
	}
	

	var single_data = findElementBySingleAttr(tagName,text,arrayAttrName,arrayAttrValue, element, parentElement);	//通过单一的属性查找对象
	if(single_data){
		console.log(single_data);
		return single_data;}
//	var much_data = findElementByMuchAttr(tagName, text, arrayAttrName, arrayAttrValue);	//通过两个的属性查找对象
//	if(much_data){return much_data;}
	var all_data = findElementByAllAttr(tagName, text, arrayAttrName, arrayAttrValue,element, parentElement);	//通过所有属性递减方式查找对象
	if(all_data){
		console.log(all_data);
		return all_data;}
	
	if(isUnion){ return;} //寻找唯一父元素， 不需要union查找
	
	var union_data = findElementByUnion(element);	//通过父子的属性查找对象
	if(union_data){return union_data;}
	
	
}


//级联查找
function findParentElement(element,parentElement){
	for (var xpaths = []; element && element.nodeType == 1 && element != parentElement; element = element.parentNode)  { 
      
          for (i = 1, sib = element.previousSibling; sib; sib = sib.previousSibling) { 
              if (sib.nodeName == element.nodeName)  i++; 
          }
          xpaths.unshift(element.nodeName.toLowerCase() + '[' + i + ']');
	}
	var tmp = xpaths.length ? '/' + xpaths.join('/') : ""; 
	return "<li>"+ tmp + "</li>";
}

//通过上下级查找
function findElementByUnion(element){
	var infoText = "";
	var parentElement = element.parentNode;
	//循环找上级
	for(;parentElement && parentElement.nodeType == 1; parentElement = parentElement.parentNode){
		//var parent_data = createParentPathFromElement(parentElement);
		
		var parent_data = createPathFromElement(parentElement,true);
		if(parent_data){
			var child_data = createPathFromElement(element,true,parentElement);//通过父元素找子元素
			
			if(child_data){
				infoText = "<li style=\"color:yellow\">级联查找：</li>" 
					+ "<li style=\"color:yellow\">父元素</li>"+ parent_data 
					+ "<li style=\"color:yellow\">子元素</li>"+ child_data.replace(/xpath=/g,"");
			}else{
				infoText = "<li style=\"color:yellow\">级联查找：</li>" 
					+ "<li style=\"color:yellow\">父元素</li>"+ parent_data 
					+ "<li style=\"color:yellow\">子元素</li>"+ findParentElement(element,parentElement);
			}
			break;
		}
	}
	
	
	return infoText;
}


//通过单一的属性查找对象
function findElementBySingleAttr(tagName, text, arrayAttrName, arrayAttrValue,element, parentElement){
	var xpath ="//";
	if(parentElement){
		xpath = element.parentNode == parentElement ? "/" : "/descendant::";
	}else{parentElement = "html";}
	var infoText = "";
	//标记
	if(tagName)
	{
		var els = $(parentElement).find(tagName) ;
		if(isUnique(els)){
			var tag = parentElement == "html" ? "tagName=" + tagName : xpath + tagName;
			infoText += "<li>" + tag+ "</li>"; 
		}
	}
	//遍历属性
	for(var i = 0 ; i <arrayAttrName.length ; i++){
		var attr = arrayAttrName[i];
		var value = arrayAttrValue[i];
		
		var els = $(parentElement).find(tagName+"[" + attr + "=\"" + value + "\"]");	//jquery查找页面
		if(isUnique(els)){
			infoText += "<li>" + "xpath=" + xpath + tagName + "[@" + attr + "='" + value +"']" + "</li>";
		}
	}
	//文本
	if(text && text.length < ATTR_VALUE_MAX_LENGTH){
		
		var els =$(parentElement).find(tagName) ;
		els = reducedByTextFilter(els, text);
		
		if(isUnique(els)){
			
			tmp = tagName.toLowerCase()=='a' && parentElement == "html" ? "linkText="+replaceText(text) : "xpath="+ xpath + tagName.toLowerCase()+"[text()='"+replaceText(text) +"']";
			infoText += "<li>" + tmp + "</li>";
		}
	}
	
	return infoText;
	
}

//text特殊字符替换
function replaceText(text){
	text = text.replace(/&/g,"&amp;");
	text = text.replace(/</g,"&lt;");
	text = text.replace(/>/g,"&gt;");
	return text;
}
//通过text过滤掉不相等的element
function reducedByTextFilter(els, text){
//	var length = els.length;
//	for(var i=0; i < length; i++){
//		if(els[i].innerText != text){
//			els.splice(i,1);
//			i--;
//			length--;
//		}
//	}
//	return els;
	return $(els).filter(function(){
		return $(this).text()==text;
	});
}

//通过多个属性进行定位唯一元素:两个属性
function findElementByMuchAttr(tagName, text, name, value){
	var infoText = "";
	var length = name.length;
	for(var i =0; i< length -1 ; i++){
		for(var j=i+1; j<length; j++){
			var els = $(tagName+"[" + name[i] + "=\"" + value[i] + "\"][" + name[j] +"=\"" + value[j] +"\"]");
			if(isUnique(els)){
				infoText += "<li>" + "xpath=//" + tagName + "[@" + name[i] + "='" + value[i] +"' and @" +name[j] +"='"+value[j]+ "']" + "</li>";
			}else{
				els = reducedByTextFilter(els, text);
				if(isUnique(els)){
					infoText += infoText += "<li>" + "xpath=//" + tagName + "[@" + name[i] + "='" + value[i] +"' and @" +name[j] +"='"+value[j]+ "' and text()='"+replaceText(text)+"']" + "</li>";
				}
			}
		}
	}
	return infoText;
}


//通过所有属性进行定位唯一元素
function findElementByAllAttr(tagName, text, name, value, element, parentElement){
	var infoText ="";
	//数组头部加入tagName
	name.unshift('tagName');
	value.unshift(tagName);
	//数组尾部加入text
	if(text){
		name.push('text');
		value.push(text);
	}
	
	
	var indexs = getPathByReducedAttr(name,value,text,parentElement);
	while(indexs.length > 0 && name.length > 0){
		
			//记录已经获得的path
			var tmpInfo =tagName;
			for(var i =0; i<indexs.length; i++){
				tmpInfo += "[@" + name[indexs[i]] + "='" + value[indexs[i]] + "']";
			}
			infoText += "<li>" + tmpInfo + "</li>";
			
			//从已发现的属性中移除其中一个
			name.splice(indexs[0],1);
			value.splice(indexs[0],1);
		

		//重新寻找path
		indexs = getPathByReducedAttr(name,value,text,parentElement);
	}
	infoText = infoText.replace(/\[@tagName.*?\]/g , "");
	infoText = infoText.replace(/\]\[/g , " and ");
	infoText = infoText.replace(/@text=/g , "text()=");
	if(parentElement){
		var xpath = element.parentNode == parentElement ? "/" : "/descendant::";
		infoText = infoText.replace(/<li>/g , "<li>"+xpath);
	}else{
		infoText = infoText.replace(/<li>/g , "<li>xpath=//");
	}
	
	return infoText;
}

//获取最简属性定位：全属性查找， 如果是对象唯一，递减属性查找，直至最简属性为止
function getPathByReducedAttr(name,value,text,parentElement){
	var arrayPathAttr = new Array();
	
	//先组合所有属性进行查找
	var totalAttr = "";
	for(var i =0; i< name.length ; i++){
		if(name[i]=="tagName"){
			totalAttr = value[i] + totalAttr;
		}
		else if(name[i]=="text"){
			continue;
		}else{
			totalAttr += "[" + name[i] + "=\"" + value[i] + "\"]";
		}
		
	}
	
	var els = parentElement ? $(parentElement).find(totalAttr) : $(totalAttr);
	if(name.indexOf('text') > -1){els = reducedByTextFilter(els, text);}
	
	if(isUnique(els)){
		//减属性再试
		for(var i = 0 ; i < name.length; i++){
			var tmpAttr = totalAttr;
			var currentAttr ="";
			if(name[i]=='tagName'){
				currentAttr = value[i];
			}
			else if(name[i]=='text'){
				//do nothing
			}
			else
			{
				currentAttr = "[" + name[i] + "=\"" + value[i] + "\"]";
			}
			
			totalAttr=totalAttr.replace(currentAttr, "");
			totalAttr = totalAttr=="" ? "*" : totalAttr;
			els = parentElement ? $(parentElement).find(totalAttr) : $(totalAttr);
			
			if(name.indexOf('text') > -1 && name[i] != "text"){els = reducedByTextFilter(els, text);}
			if(isUnique(els))
			{
				continue;	//依然唯一，则继续减少属性
			}
			else
			{
				totalAttr = tmpAttr;	//不是唯一的，需要还原属性
				arrayPathAttr.push(i);
			}
		}
	}
	
	return arrayPathAttr;
}


function createInfoDiv() {
	if(!infoDiv){
		addCustomStyle();
	    infoDiv = document.createElement('div');
	    infoDiv.id = 'autotest';
	    document.body.appendChild(infoDiv);
	}
    
}

function addCustomStyle() {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML='#autotest{background-color:rgba(0,10,0,.8);color:#fff;position:fixed;top:0;left:0;right:0;display:block;z-index:999999;line-height:20px;} #autotest li{text-align:left;color:#fff;font-size:14px;font-family:monospace;}';
    document.head.appendChild(style);
}