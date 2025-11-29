<?php
class HttpClient {
    public static function get($url, $headers = []) {
        return self::request('GET', $url, null, $headers);
    }
    
    public static function post($url, $data = null, $headers = []) {
        return self::request('POST', $url, $data, $headers);
    }
    
    private static function request($method, $url, $data = null, $headers = []) {
        $ch = curl_init();
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }
        
        if (!empty($headers)) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            throw new Exception('HTTP Error: ' . $error);
        }
        
        return [
            'status' => $httpCode,
            'body' => $response,
            'data' => json_decode($response, true)
        ];
    }
}
?>