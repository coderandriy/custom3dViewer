<?php
/*
Plugin Name:  	3D Viewer Plugin
Description:  	This plugin displays "3D VIEW" when the '3dviewer' parameter is present in the URL.
Version: 	  	1.0
Author:		  	Rolesh
License:      	GPL2
License URI:  	https://www.gnu.org/licenses/gpl-2.0.html
Text Domain:  	wpb-tutorial
*/



/**
 * 
 * 
 * Short Code for 3D Viewer
 */

function gviewer_shortcode($atts)
{
    $atts = shortcode_atts(
        array(
            'file' => '',
            'width' => '300',
            'height' => '300',
        ),
        $atts,
        'gviewer'
    );
    $file = esc_url($atts['file']);
    $width = esc_attr($atts['width']);
    $height = esc_attr($atts['height']);

    if (empty($file)) {
        return '<p>Please provide a file URL.</p>';
    }

    ob_start();
?>
    <div style="border: 1px solid #CCC; display: inline-block; width: <?php echo $width; ?>px; height: <?php echo $height+2; ?>px; position: relative"  data-url="<?php echo $file; ?>">
        <div class="customized3dViewer" style="width: 100%; height: <?php echo $height; ?>px;" data-url="<?php echo $file; ?>"></div>
        <div class="camera_controller">
            <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/left.png' ?> class="rightbtn" onclick = "setCameraPosition(event)">
            <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/up.png' ?> class="upbtn" onclick = "setCameraPosition(event)">
            <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/front.png' ?> class="frbtn" onclick = "setCameraPosition(event)">
            <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/up.png' ?> class="downbtn" onclick = "setCameraPosition(event)">
            <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/left.png' ?> class="leftbtn" onclick = "setCameraPosition(event)">
        </div>
        <div class="loadingScreen" style="position: absolute; top: 0px; width: 100%; height: 100%">
            <img class="gif-image" src=<?php echo plugin_dir_url(__FILE__) . 'js/icon/loading.gif' ?> alt="Centered GIF Image">
        </div>
        <div class = "animationController" style="position: absolute; bottom: 0px; width: 100%; background-color: rgba(255,255,255, 0.5)">
            <button class="active up-btn" onclick="changeMesh('<?php echo $file; ?>', event)">U</button>
            <button class="active lo-btn" onclick="changeMesh('<?php echo $file; ?>', event)">L</button>
            <button class="meshPlayBtn" onclick="playMesh('<?php echo $file; ?>', event)"><i class='gcis gci-play'></i></button>
            <input type = "range" min = "0" max = "50" class="animateSlider" oninput = "changeMesh('<?php echo $file; ?>')">
            <div style="display:inline-block; position: relative; top: -3px">
                <span class="currentStep">1</span>/<span class="maxStep">50</span>
            </div>
        </div>
    </div>
<?php
    return ob_get_clean();
}
add_shortcode('gViewer', 'gviewer_shortcode');
// Enqueue necessary scripts and styles
function enqueue_bootstrap()
{
    // Enqueue jQuery from CDN
    wp_enqueue_script('jquery', 'https://code.jquery.com/jquery-3.5.1.min.js', array(), null, true);

    // Enqueue Bootstrap CSS
    wp_enqueue_style('bootstrap-css', 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css');

    // Enqueue Bootstrap Bundle JS (includes Popper.js)
    wp_enqueue_script('bootstrap-js', 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.bundle.min.js', array('jquery'), null, true);
    // 
}
add_action('wp_enqueue_scripts', 'enqueue_bootstrap');

function custom_3d_viewer_enqueue_scripts()
{
    wp_enqueue_script('custom-3d-viewer', plugin_dir_url(__FILE__) . 'js/custom-3d-viewer.js', array('jquery'), null, true);
}
add_action('wp_enqueue_scripts', 'custom_3d_viewer_enqueue_scripts');

function three_scripts()
{
    wp_enqueue_style('custom3d-css', plugin_dir_url(__FILE__) . 'assets/custom3dviewer.css', null, true);
    wp_enqueue_script('three_scripts', plugin_dir_url(__FILE__) . 'js/three.js', array('jquery'), null, true);
    wp_enqueue_script('draco_loader', plugin_dir_url(__FILE__) . 'js/DRACOLoader.js', array('jquery'), null, true);
    wp_enqueue_script('stl_loader', plugin_dir_url(__FILE__) . 'js/STLLoader.js', array('jquery'), null, true);
    wp_enqueue_script('ply_loader', plugin_dir_url(__FILE__) . 'js/PLYLoader.js', array('jquery'), null, true);
    wp_enqueue_script('arcball_controller', plugin_dir_url(__FILE__) . 'js/ArcballControls.js', array('jquery'), null, true);
    wp_enqueue_script('zip_controller', 'https://cdn.jsdelivr.net/npm/jszip@3.7.1/dist/jszip.min.js', array('jquery'), null, true);
}
add_action('wp_enqueue_scripts', 'three_scripts');

function exporter_scripts()
{
    wp_enqueue_script('ply_exporter', plugin_dir_url(__FILE__) . 'js/PLYExporter.js', array('jquery'), null, true);
    wp_enqueue_script('stl_exporter', plugin_dir_url(__FILE__) . 'js/STLExporter.js', array('jquery'), null, true);
}
add_action('wp_enqueue_scripts', 'exporter_scripts');

// Add the button to the PeepSo chat interface
function peepso_3d_viewer_add_button()
{
    echo '<button class="peepso-3d-view-button">View 3D Model</button>';
}
// add_action('peepso_activity_post_attachment', 'peepso_3d_viewer_add_button');

function mytheme_add_3d_model_modal()
{
?>
    <style>
        .modal-custom-inner .modal-content {
            z-index: 100001 !important;
            width: 100% !important;
            top: 50%;
            transform: translate(0, -50%) !important;
        }

        .modal-custom-inner {
            top: 50%;
            transform: translate(0, -50%) !important;
            margin: 0 !important;
        }

        .modal-custom-3d {
            position: fixed;
            width: 100% !important;
            height: 100vh !important;
            display: flex !important;
            justify-content: center;
            top: 0 !important;
            background-color: rgba(0, 0, 0, 0.4) !important;
			z-index: 100000 !important;
            padding: 0 !important;
        }

        .modal-custom-3d .modal-header {
            padding: 20px !important;
        }

        #myModalLabel {
            font-size: 1.5em !important;
        }

		.hide {
			display: none!important;
		}
		
        @media screen and (min-width: 992px) {
            .modal-custom-inner {
                width: 60% !important;
                height: 70vh !important;
            }
        }

        @media (min-width: 992px) {
            .modal-lg,
            .modal-xl {
                max-width: 60%;
            }
        }

        @media (min-width: 576px) {
            .modal-dialog {
                max-width: 75%;
            }
        }

        @media screen and (max-width:650px) {
            .modal-dialog {
                width: 100% !important;
            }

            .modal-custom-3d {
                margin: auto !important;
            }
        }

        @media screen and (min-width: 650px) {
            .modal-custom-inner {
                width: 60% !important;
            }
        }
        #rDecodeconfirmModal {
            background-color: rgba(33, 33, 33, 0.4);
        }
        .decoded_modal_content {
            position: relative;
            width: 450px;
            height: 200px;
            top: 30%;
            left: calc(50% - 225px);
            padding: 20px;
            background-color: white;
            box-shadow: 5px 5px 5px #666;
            border-radius: 5px;
        }
        .decoded_modal_content p {
            font-weight: bolder;
            font-size: 20px;
            margin-top: 20px
        }
        #rDecodeconfirmModal button {
            width : 30%;
            margin: 20px;
        }
        
    </style>
    <!-- Modal HTML Structure -->
    <div class="modal-custom-3d hide" id="View3DModal">
        
        <div class="modal-dialog modal-lg modal-custom-inner" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="myModalLabel">3D Model Viewer</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div style = "position: relative">
                    <div class="loadingScreen">
                        <img class="gif-image" src=<?php echo plugin_dir_url(__FILE__) . 'js/icon/loading.gif' ?> alt="Centered GIF Image">
                    </div>
                    <div class="modal-body" id="modelContainer" style = "padding: 0px">
                        
                    </div>
                    <div class="camera_controller">
                        <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/left.png' ?> class="rightbtn" onclick = "setCameraPosition(event)">
                        <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/up.png' ?> class="upbtn" onclick = "setCameraPosition(event)">
                        <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/front.png' ?> class="frbtn" onclick = "setCameraPosition(event)">
                        <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/up.png' ?> class="downbtn" onclick = "setCameraPosition(event)">
                        <img src=<?php echo plugin_dir_url(__FILE__) . 'assets/left.png' ?> class="leftbtn" onclick = "setCameraPosition(event)">
                    </div>
                    <div class = "animationController">
                        <button class="active up-btn">U</button>
                        <button class="active lo-btn">L</button>
                        <button class="meshPlayBtn"><i class='gcis gci-play'></i></button>
                        <input type = "range" min = "0" max = "50" class="animateSlider">
                        <div style="display:inline-block; position: relative; top: -3px">
                            <span class="currentStep">1</span>/<span class="maxStep">50</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div id="rDecodeconfirmModal" class="modal hide">
        <div class="decoded_modal_content">
        <p>Do you want to download decoded file?</p>
        <p>
            <button id="confirmDecodeYes">Yes</button>
            <button id="confirmDecodeNo" style="float: right">No</button>
        </p>
        </div>
  </div>
<?php
}

add_action('wp_footer', 'mytheme_add_3d_model_modal');

function view_custom3d_models() {
    ?>
    <script type="text/javascript">
        jQuery(document).ready(function ($) {
            let shortcodeModelContainers = $(".customized3dViewer")
            for(let counter = 0; counter < shortcodeModelContainers.length; counter++) {
                view3DModelR(shortcodeModelContainers[counter].getAttribute("data-url"), shortcodeModelContainers[counter]);
            }
        });
    </script>
    <?php
}

add_action('wp_footer', 'view_custom3d_models');
?>