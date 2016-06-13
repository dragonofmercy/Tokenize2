<?php
header('content-type: text/json');

$obj = json_decode(file_get_contents('names.json'), true);
$search = preg_quote($_REQUEST['search']);
$ret = array();

foreach($obj as $item)
{
    if(preg_match('/^' . $search . '/i', $item['text']))
    {
        $ret[] = array('value' => $item['text'], 'text' => $item['text']);
    }
}

echo json_encode($ret);