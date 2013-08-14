<?php
	Class gmap_coordinates{
	
		public $wpdb;
		public $update_lat;
		public $update_lng;

		public function __construct() {
			$this->wpdb = $GLOBALS[wpdb];
		}

		//wordpress Save function
		function get_coordinates( $post_ID ){
			
			if ( !wp_is_post_revision( $post_id ) ) {

				//Check to make sure function is not executed more than once on save
				if ( defined('DOING_AUTOSAVE') && DOING_AUTOSAVE ) 
				return;

				if ( !current_user_can('edit_post', $post_ID) ) 
				return;

				$location_address = get_field('location_address');
				$address = str_replace(" ", "+", $location_address);
				$url = "http://maps.google.com/maps/api/geocode/json?address=$address&sensor=false";

				$ch = curl_init();
				curl_setopt($ch, CURLOPT_URL, $url);
				curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
				curl_setopt($ch, CURLOPT_PROXYPORT, 3128);
				curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
				curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
				$response = curl_exec($ch);
				curl_close($ch);
				$response_a = json_decode($response);

				$this->update_lat = $response_a->results[0]->geometry->location->lat;
				$this->update_lng = $response_a->results[0]->geometry->location->lng;

				add_filter('acf/update_value/name=location_lat', array($this, "update_lat"), 10, 3);
				add_filter('acf/update_value/name=location_lng', array($this, "update_lng"), 10, 3);

				add_action('save_post', 'get_coordinates');	
			}

		}

		function update_lat( ) {
			return $this->update_lat;
		}
		
		function update_lng( ) {
			return $this->update_lng;
		}
	}
?>
