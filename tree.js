/*
 最简洁快速的tree插件
 采用hash列表处理数据，一次循环完成树的建立，不用递归效率高很多
 一百多行代码，没法更简洁
*/

//字符串替换
String.prototype.replaceAll = function (src, dec) {
    return this.replace(new RegExp(src, "gm"), dec);
};

function csv2json(csv) {
    if (!csv) return false;

    var arr = csv.split("\r\n");

    var i = 0, len = arr.length, json = [];
    for (; i < len; i++) {
        if (arr[i]) {
            var row = arr[i].replaceAll("\"", "").split(",");
            json.push(row);
        }
    }

    return json;
};

$.fn.tree = function (option) {
    var defaults = {
        data: null, //csv或[]数据
        isShow: false, //自动展开节点
        notTitle: true, //csv第一行非标题行
        isClear: true, //清空树及缓存数据
        addOtherData: null //附加节点函数
    };
    var option = $.extend(defaults, option);

    var self = this;

    function createLi(arr) {
        var el = document.createElement('li');

        //el.className = 'leaf';
        var link = document.createElement('a');
        link.setAttribute('id', arr[0]);
        link.setAttribute('pid', arr[1]);
        if (arr.length > 4 && arr[4]) {
            link.setAttribute('tempid', arr[4]);
            if (arr[3] == 1) $(el).addClass('leaf');
        }
        if (arr.length > 5 && arr[6]) link.setAttribute('gbcode', arr[6]);

        //图标 合并到link 
        /*var span = document.createElement('div');
        span.className = 'btn';
        link.appendChild(span);*/

        link.appendChild(document.createTextNode(arr[2].replaceAll("\"", "")));
        el.appendChild(link);

        if (option.addOtherData) {
            option.addOtherData(el, arr);
        }
        return el;
    };

    //最精简，最高效的树结构生成 20150914
    //不采用递归的方式实现，算法再次精简
    //数据格式为csv,如非数组，先进行转化，数组格式为：[[id,pId,name,isLeaf],...]
    //2015101 增加节点，重复的不处理，新建表格时调用
    function loadData() {
        //清空树及缓存数据
        if (option.isClear) {
            $(self).removeData('hashlist');
            $(self).empty();
        }

        //数据格式转化
        var data = [];
        if ($.isArray(option.data)) {
            data = option.data;
        } else {
            data = csv2json(option.data);
        }
        if (!data) return;

        //生成所有元素li, hash列表快速找父亲，通过tree.hashlist无需递归生成树
        var i = option.notTitle ? 0 : 1,
                len = data.length,
                parent, el, arr;

        if (len === 0) return;

        //生成haslist并存储到tree控件
        var hashlist = $(self).data('hashlist');
        if (!hashlist) {
            hashlist = {};
            $(self).data('hashlist', hashlist);
        }

        var arraylist = [];
        for (; i < len; i++) {
            arr = data[i];
            if (!hashlist[arr[0]]) {
                el = createLi(arr);
                hashlist[arr[0]] = { pId: arr[1], node: el, level: 0, isLeaf: arr[3] };
                arraylist.push(hashlist[arr[0]]);
            }
        }

        //生成根节点ul
        var $root = $(self).children('ul'), isFirst = false, root;
        if ($root.length === 0) {
            isFirst = true;
            //采用DocumentFragment提高效率, 和xml效率差不多，但不需要xml支持
            var fragment = document.createDocumentFragment();
            root = document.createElement('ul');
            //root.className = 'level0';
            fragment.appendChild(root);
        } else {
            root = $root[0];
        }

        //生成ul, li找父亲ul  
        var obj, ulist, ul, level, nextLink;
        for (var j = 0, len = arraylist.length; j < len; j++) {
            obj = arraylist[j];

            //找父亲
            parent = hashlist[obj.pId];
            if (!parent) {
                //无父加到root
                root.appendChild(obj.node);
                obj.node.className = 'level0';
                if (option.isShow) obj.node.className = 'level0 open'; //加入open样式
            } else {
                //有则取li父节点的ul
                ul = parent.node.lastChild;

                //无ul 生成ul
                if (!ul || ul.nodeName !== 'UL') {
                    ul = document.createElement('ul');
                    // if (option.isShow) $(ul).show();

                    parent.node.appendChild(ul);
                }

                //节点层级计算，取父亲+1
                //level = parent.level + 1;
                //obj.level = level;
                //obj.node.className = 'level' + level; // +(obj.isLeaf == '1' ? ' leaf' : '');
                //$(obj.node).addClass('level' + level);
                //ul.className = 'level' + level + (obj.isLeaf == '1' ? ' leaf' : '');

                //li挂到ul内
                if (option.isShow) obj.node.className = "open"; //加入open样式
                ul.appendChild(obj.node);
            }
        }

        //全树挂载显示。
        if (isFirst) {
            $(self).append(fragment);
            $(root).find('li:first').addClass('open');
        }
    }

    loadData();

    //模板,查询 子级下载显示
    $(self).delegate('a','click', function (e) {
        var et = $(e.target);        
        et.parent().toggleClass('open');
    })
};

