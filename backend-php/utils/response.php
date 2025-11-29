<?php
class Response {
    public static function success($data, $message = 'Success') {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
        exit();
    }
    
    public static function error($message, $code = 400, $details = null) {
        http_response_code($code);
        $response = [
            'success' => false,
            'error' => $message
        ];
        
        if ($details) {
            $response['details'] = $details;
        }
        
        echo json_encode($response);
        exit();
    }
    
    public static function cached($data, $fromCache = false) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'cached' => $fromCache,
            'data' => $data
        ]);
        exit();
    }
}
?>