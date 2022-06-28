# Signing API Requests

# sample resquest
# http://localhost:8080/client/api?command=deployVirtualMachine&serviceOfferingId=1&diskOfferingId=1&templateId=2
# &zoneId=4&apiKey=miVr6X7u6bN_sdahOBpjNejPgEsT35eXq-jB8CG20YI3yaxXcgpyuaIRmFI_EJTVwZ0nUkkJbPmY3y2bciKwFQ&signature=Lxx1DM40AjcXU%2FcaiK8RAP0O1hU%3D

# Breaking this down, we have several distinct parts to this URL.
#   Base URL: This is the base URL to the CloudStack Management Server.
#       http://localhost:8080
#   API Path: This is the path to the API Servlet that processes the incoming requests.
#       /client/api?
#   Command String: This part of the query string comprises of the command, its parameters, and the API Key that identifies the account.
#       Note: As with all query string parameters of field-value pairs, the “field” component is case insensitive while all “value” values are case sensitive.
#   Signature: This is the signature of the command string that is generated using a combination of the user’s Secret Key and the HMAC SHA-1 hashing algorithm.
#       &signature=Lxx1DM40AjcXU%2FcaiK8RAP0O1hU%3D


# Every API request has the format Base URL+API Path+Command String+Signature.

# For each field-value pair (as separated by a ‘&’) in the Command String, URL encode each value so that it can be safely sent via HTTP GET.

# To generate the signature.

import urllib
import hashlib
import hmac
import base64

request={}
request['command']='listUsers'
request['response']='json'
request['apikey']='Give your API key'

secretkey= 'Give your secret key'

request_str='&'.join(['='.join([k,urllib.quote_plus(request[k])]) for k in request.keys()])
sig_str='&'.join(['='.join([k.lower(),urllib.quote_plus(request[k].lower().replace('+','%20'))])for k in sorted(request.iterkeys())])
sig=hmac.new(secretkey,sig_str,hashlib.sha1)
sig=hmac.new(secretkey,sig_str,hashlib.sha1).digest()
sig=base64.encodestring(hmac.new(secretkey,sig_str,hashlib.sha1).digest())
sig=base64.encodestring(hmac.new(secretkey,sig_str,hashlib.sha1).digest()).strip()
sig=urllib.quote_plus(base64.encodestring(hmac.new(secretkey,sig_str,hashlib.sha1).digest()).strip())
print(sig)
