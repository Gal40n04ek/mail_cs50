document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  
  // By default, load the inbox
  load_mailbox('inbox');

  document.querySelector('#compose-form').addEventListener('submit', sendEmails);
});

function compose_email(address, timestamp, subject, body, checker) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#mainContentMailbox').style.display = 'none';
  console.log("address", address);
  // Clear out composition fields
  if (checker){
    document.querySelector('#compose-recipients').value = `${address}`;
    document.querySelector('#compose-subject').value = `Re: ${subject}`;
    document.querySelector('#compose-body').value = `\n\n\n------------------------------------------------------------\n${timestamp} ${address} wrote ${body}`;
  }
  else {
    document.querySelector('#compose-recipients').value =  "";
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }  
}


function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mainContentMailbox').style.display = 'block';
  
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  document.querySelector('#mainContentMailbox').innerHTML="";
  const table = document.createElement('table');
  const tr = document.createElement('tr');
  const row = [];

  //get the list of the mails in the mailbox (inbox, sent or archive)
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then((emails) => {emails.forEach((item,i) => {
    let firstItem = "";
    if (i === 0) {
      document.querySelector('#mainContentMailbox').append(table);
      document.querySelector('table').appendChild(tr);
      if (mailbox === `sent`) {
        firstItem = 'Sent to recipients';
      }
      else {
        firstItem = 'From:';
      }
      
      tr.innerHTML = `<th>${firstItem}</th><th>Subject</th><th>TimeStamp</th><th>View</th>`
    }
    row[i] = document.createElement('tr');
    if (mailbox === `sent`) {
      firstItem = item.recipients;
    }
    else {
      firstItem = item.sender;
    }
    if ((mailbox === `archive` && item.archived) || (mailbox === `sent`) || (mailbox === `inbox` && !item.archived)){
      row[i].innerHTML = `<td>${firstItem}</td><td>${item.subject}</td><td>${item.timestamp}</td><td><button class="readEmail" data-id=${item.id}>View</button></td>`
      document.querySelector('table').appendChild(row[i]);  
      if (mailbox === "inbox") {
        if (item.read) {
          row[i].setAttribute("style", "background: white");
        }
        else {
          row[i].setAttribute("style", "background: lightgrey");
        }
      }
    }
    document.querySelectorAll('.readEmail').forEach(function(button) {
      button.onclick = function(event) {
        email_id = button.dataset.id;        
        emailContent(email_id, mailbox);
        return false;
      }
    })
  })
  })
  .catch(error => console.log(error));
}

//get the email by email_id

function emailContent(email_id, mailbox) {
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    const div = document.createElement('div');
    div.innerHTML=`<p><strong>FROM: </strong>${email.sender}</p><p><strong>TO: </strong>${email.recipients}</p>
    <p><strong>SUBJECT: </strong>${email.subject}</p><p><strong>TIMESTAMP: </strong>${email.timestamp}</p>
    <div class="activityButtons"><button class="replyEmail">Reply</button><button class="archiveEmail"></button></div>`
    div.setAttribute("id", "emailHeader");
    document.querySelector('#mainContentMailbox').innerHTML="";
    document.querySelector('#mainContentMailbox').append(div);
    if (mailbox === 'sent') {
      document.querySelector('.archiveEmail').setAttribute("style", "display:none");
      document.querySelector('.replyEmail').setAttribute("style", "display:none");
    }
    else {
      if (mailbox === 'archive'){
        document.querySelector('.replyEmail').setAttribute("style", "display:none");
      }      
    }
    const divContent = document.createElement('div');
    divContent.innerHTML = `${email.body}`;
    divContent.setAttribute("id", "emailContent")
    document.querySelector('#mainContentMailbox').append(divContent);
    if (email.archived) {
      document.querySelector('.archiveEmail').innerHTML="Unarchive";
    }
    else {
      document.querySelector('.archiveEmail').innerHTML="Archive";
    }
    
    // Set the email to read.
    if (mailbox === 'sent') {
      fetch(`/emails/${email.id}`, {
        method: "PUT",
        body: JSON.stringify({
          read: true
        })
      });
    }
    
    
    document.querySelector('.replyEmail').onclick = function(event) {
      event.preventDefault(); 
      let checker = true;
      compose_email(email.sender, email.timestamp, email.subject, email.body, checker);
    } 
    
    document.querySelector('.archiveEmail').onclick = function(event) {
      event.preventDefault(); 
      let archiveChecker = email.archived;
      markEmails(email.id, archiveChecker);
      document.location.reload();
      // if (!archiveChecker) {
      //   setTimeout(load_mailbox('archive'), 2000);
      // }
      // else {
      //   setTimeout(load_mailbox('inbox'), 2000);
      // }
    }
  })
  .catch(error => console.log(error));
}

// send emails

function sendEmails(event) {
  // Modifies the default beheavor so it doesn't reload the page after submitting.
  event.preventDefault();

  // Get the required fields.
  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    })
  })
  .then(response => response.json())
  .then(result => {
    //show in console
    load_mailbox('inbox');
  })
  .catch(error => console.log(error));
}

// mark emails as read-unread, archived or not
function markEmails(email_id, checker) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify ({
      archived: !checker,
    })
  })
  .catch(error => console.log(error));
}