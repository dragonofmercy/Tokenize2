<?php
header('content-type: text/json');

$obj = json_decode(file_get_contents('names.json'), true);
$ret = array();

foreach($obj as $item)
{
    if(stripos($item['text'], $_REQUEST['search']) !== false)
    {
        $ret[] = array('value' => $item['text'], 'text' => $item['text']);
    }
}

echo json_encode($ret);