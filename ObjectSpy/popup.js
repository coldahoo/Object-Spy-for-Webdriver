pop_init();	//pop页面初始化

function pop_init(){
	chrome.storage.local.get(function(rst){
		if(rst["ATTR_FILTER"]==undefined || rst["ATTR_VALUE_MAX_LENGTH"]==undefined || rst["SWITCH_ON"]==undefined)
		{
			storageIn();
			pop_init();
		}
		else
		{
			$("#attrFilter").val(rst["ATTR_FILTER"]);
			$("#maxLength").val(rst["ATTR_VALUE_MAX_LENGTH"]);
			if(rst["SWITCH_ON"]){ $('#switch').click(); }
		}
	});
}
//option按钮
$("#optionBtn").click(function(){
	$("#propertyDiv").toggle();
});
//保存按钮
$("#saveBtn").click(function(){
	var attr = $("#attrFilter").val();
	var maxLength = $("#maxLength").val();
	var switch_on = $('#switch').data('clicks');
	storageIn(attr,maxLength,switch_on);
	alert("success...");
	$("#propertyDiv").hide();
});
//开关按钮
$('#switch').click(function() {
	var clicks = $(this).data('clicks');
	var attr = $("#attrFilter").val();
	var maxLength = $("#maxLength").val();
	storageIn(attr,maxLength,!clicks);
	$(this).data("clicks", !clicks);
	reloadApp();
});


//存入local storage
function storageIn(attr,maxLength,switch_on){
	chrome.storage.local.remove(["ATTR_FILTER","ATTR_VALUE_MAX_LENGTH","SWITCH_ON"]);	//先remove
	if(attr==undefined){attr = INIT_ATTR_FILTER;}
	if(maxLength==undefined){maxLength=INIT_ATTR_VALUE_MAX_LENGTH;}
	if(switch_on==undefined){switch_on=INIT_SWITCH_ON;}
	
	chrome.storage.local.set({"ATTR_FILTER":attr},function(){	//设置ATTR_FILTER
		if (chrome.runtime.error) {alert("set ATTR_FILTER failed.");return;}
	});
	chrome.storage.local.set({"ATTR_VALUE_MAX_LENGTH":maxLength},function(){	//设置ATTR_VALUE_MAX_LENGTH
		if (chrome.runtime.error) {alert("set ATTR_VALUE_MAX_LENGTH failed.");return;}
	});
	chrome.storage.local.set({"SWITCH_ON":switch_on},function(){	//设置开关
		if (chrome.runtime.error) {alert("set SWITCH_ON failed.");return;}
	});
}

//读取local storage
//function storageOut(str){
//	chrome.storage.local.get(function(rst){
//		return rst[str] == undefined ? str : rst[str];
//	});
//}



