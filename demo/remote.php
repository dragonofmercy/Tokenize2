<?php
header('content-type: text/json');

$search = preg_quote(isset($_REQUEST['search']) ? $_REQUEST['search'] : '');
$start = (isset($_REQUEST['start']) ? $_REQUEST['start'] : 1);
$obj = json_decode(file_get_contents('names.json'), true);
$ret = array();

foreach($obj as $item)
{
    if(preg_match('/' . ($start ? '^' : '') . $search . '/i', $item['text']))
    {
        $ret[] = array('value' => $item['text'], 'text' => $item['text']);
    }
}

echo json_encode($ret);