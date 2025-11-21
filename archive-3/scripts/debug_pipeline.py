import boto3
import json
from datetime import datetime
import sys

def check_last_execution():
    client = boto3.client('stepfunctions')
    
    # Get State Machine ARN
    sms = client.list_state_machines()
    target_arn = None
    for sm in sms['stateMachines']:
        if 'pipeline' in sm['name'] and 'housing' in sm['name']:
            target_arn = sm['stateMachineArn']
            print(f"Found State Machine: {sm['name']}")
            break
            
    if not target_arn:
        print("Could not find the State Machine ARN automatically.")
        return

    # Get executions
    executions = client.list_executions(
        stateMachineArn=target_arn,
        maxResults=1
    )
    
    if not executions['executions']:
        print("No executions found.")
        return
        
    last_exec = executions['executions'][0]
    exec_arn = last_exec['executionArn']
    print(f"Checking Last Execution: {last_exec['name']} (Status: {last_exec['status']})")
    
    history = client.get_execution_history(
        executionArn=exec_arn,
        reverseOrder=False
    )
    
    print("\n--- FULL EVENT DUMP ---")
    for event in history['events']:
        print(f"Type: {event['type']}")
        if 'stateExitedEventDetails' in event:
            print(f"  State: {event['stateExitedEventDetails']['name']}")
        if 'taskFailedEventDetails' in event:
            print(f"  ERROR: {event['taskFailedEventDetails']}")
        if 'executionFailedEventDetails' in event:
            print(f"  EXEC FAIL: {event['executionFailedEventDetails']}")

if __name__ == "__main__":
    try:
        check_last_execution()
    except Exception as e:
        print(f"Error running debug script: {e}")
