<?php
function select_options($selected = array()){
    $output = '';
    foreach(json_decode(file_get_contents('names.json'), true) as $item){
        $output.= '<option value="' . $item['value'] . '"' . (in_array($item['value'], $selected) ? ' selected' : '') . '>' . $item['text'] . '</option>';
    }
    return $output;
}
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

    <title>Tokenize2 demo</title>

    <script src="//code.jquery.com/jquery-2.2.4.min.js"></script>

    <link href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" rel="stylesheet" />
    <script src="//code.jquery.com/ui/1.11.4/jquery-ui.min.js"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/prettify/r298/prettify.min.js"></script>

    <link href="../tokenize2.css" rel="stylesheet" />
    <script src="../tokenize2.js"></script>
    <link href="demo.css" rel="stylesheet" />

</head>
<body onload="prettyPrint()">

    <div class="container">

        <nav class="navbar navbar-default">
            <div class="navbar-header">
                <a class="navbar-brand" href="#">Tokenize2</a>
            </div>
        </nav>

        <div class="row">

            <div class="col-md-6">
                <div class="panel">
                    <div class="panel-heading">
                        <h2 class="panel-title">Default usage</h2>
                    </div>
                    <div class="panel-body">
                        <select class="tokenize-sample-demo1" multiple>
                            <?php echo select_options() ?>
                        </select>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="panel">
                    <div class="panel-heading">
                        <h2 class="panel-title">Remote data source</h2>
                    </div>
                    <div class="panel-body">
                        <select class="tokenize-remote-demo1" multiple></select>
                    </div>
                </div>
            </div>

        </div>
        <div class="row">

            <div class="col-md-6">
                <div class="panel">
                    <div class="panel-heading">
                        <h2 class="panel-title">Limit the number of tokens</h2>
                    </div>
                    <div class="panel-body">
                        <select class="tokenize-limit-demo1" multiple>
                            <?php echo select_options() ?>
                        </select>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="panel">
                    <div class="panel-heading">
                        <h2 class="panel-title">One token behavior</h2>
                    </div>
                    <div class="panel-body">
                        <select class="tokenize-limit-demo2" multiple>
                            <?php echo select_options() ?>
                        </select>
                    </div>
                </div>
            </div>

        </div>
        <div class="row">

            <div class="col-md-6">
                <div class="panel">
                    <div class="panel-heading">
                        <h2 class="panel-title">Sortable tokens</h2>
                    </div>
                    <div class="panel-body">
                        <select class="tokenize-sortable-demo1" multiple>
                            <?php echo select_options(array('CH', 'FR', 'IT', 'DE')) ?>
                        </select>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="panel">
                    <div class="panel-heading">
                        <h2 class="panel-title">Placeholder</h2>
                    </div>
                    <div class="panel-body">
                        <select class="tokenize-ph-demo1" multiple>
                            <?php echo select_options() ?>
                        </select>
                    </div>
                </div>
            </div>

        </div>
        <div class="row">

            <div class="col-md-6">
                <div class="panel">
                    <div class="panel-heading">
                        <h2 class="panel-title">Custom tokens allowed</h2>
                    </div>
                    <div class="panel-body">
                        <select class="tokenize-custom-demo1" multiple>
                            <?php echo select_options() ?>
                        </select>
                    </div>
                </div>
            </div>

        </div>

        <script>
            $('.tokenize-sample-demo1').tokenize2();
            $('.tokenize-remote-demo1').tokenize2({
                dataSource: 'remote.php'
            });
            $('.tokenize-limit-demo1').tokenize2({
                tokensMaxItems: 5
            });
            $('.tokenize-limit-demo2').tokenize2({
                tokensMaxItems: 1
            });
            $('.tokenize-ph-demo1').tokenize2({
                placeholder: 'Please add new tokens'
            });
            $('.tokenize-sortable-demo1').tokenize2({
                sortable: true
            });
            $('.tokenize-custom-demo1').tokenize2({
                tokensAllowCustom: true
            });

            $('#btnClear').on('mousedown touchstart', function(e){
                e.preventDefault();
                $('.tokenize-demo1, .tokenize-demo2, .tokenize-demo3').trigger('tokenize:clear');
            });
        </script>

    </div>

</body>
</html>