import React from 'react';
import SiteHead from '../../components/SiteHead';
import axios from 'axios';
import meta from './meta.json';
import ExternalLink from '../../components/ExternalLink.js';
import Loader from '../../components/Loader';
import './index.css';
import blockedUsers from './blockedUsers.json';
import members from './members.json';

class ContributorsPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contributors: {}
    };
  }

  componentDidMount() {
    this.fetchContributors();
  }

  fetchRepositories() {
    return new Promise((resolve, reject) => {
      axios.get('https://api.github.com/orgs/TheBastionBot/repos', {
        headers: {
          'If-None-Match': window.localStorage.getItem('github_repos_etag')
        },
        validateStatus: function (status) {
          return (status >= 200 && status < 300) || status === 304;
        }
      }).then(response => {
        let repos = [];

        if (response.status === 304 && window.localStorage.getItem('github_repos_etag')) {
          repos = JSON.parse(window.localStorage.getItem('github_repos'));
        }
        else if (response.data && response.data.length) {
          repos = response.data.map(repo => repo.name);

          if (response.headers) {
            window.localStorage.setItem('github_repos_etag', response.headers.etag);
            window.localStorage.setItem('github_repos', JSON.stringify(repos));
          }
        }

        resolve(repos);
      }).catch(e => {
        reject(e);
      });
    });
  }

  fetchContributors() {
    this.fetchRepositories()
      .then(repositories => {
        let contributors = this.state.contributors;

        for (let repo of repositories) {
          axios.get(`https://api.github.com/repos/TheBastionBot/${repo}/contributors`, {
            headers: {
              'If-None-Match': window.localStorage.getItem(`github_repo_${repo.toLowerCase()}_etag`)
            },
            validateStatus: function (status) {
              return (status >= 200 && status < 300) || status === 304;
            }
          }).then(response => {
            let users = [];

            if (response.status === 304 && window.localStorage.getItem(`github_repo_${repo.toLowerCase()}_etag`)) {
              users = JSON.parse(window.localStorage.getItem(`github_${repo.toLowerCase()}_contributors`));
            }
            else if (response.data && response.data.length) {
              users = response.data.filter(user => user.type === 'User').filter(user => !blockedUsers.includes(user.login)).map(user => {
                return {
                  login: user.login,
                  contributions: user.contributions
                }
              });

              if (response.headers) {
                window.localStorage.setItem(`github_repo_${repo.toLowerCase()}_etag`, response.headers.etag);
                window.localStorage.setItem(`github_${repo.toLowerCase()}_contributors`, JSON.stringify(users));
              }
            }

            for (let user of users) {
              if (contributors.hasOwnProperty(user.login)) {
                contributors[user.login] += user.contributions;
              }
              else {
                contributors[user.login] = user.contributions;
              }
            }

            this.setState({
              contributors: contributors
            });
          }).catch(e => {
            console.error(e);
          });
        }
      })
      .catch(e => {
        console.error(e);
      })
  }

  render() {
    return (
      <div id='contributors'>
        <SiteHead
          title={ meta.title }
          description={ meta.description }
          image={ meta.image }
        />

        <div className='header'>
          <h1>Contributors</h1>
          <p>All the users who have contributed code to The Bastion Bot Project.</p>
        </div>

        <div className='container'>
          {
            Object.keys(this.state.contributors).length
            ?
              Object.keys(this.state.contributors).map((user, i) => {
                return (
                  <div className='contributor' key={ i }>
                    <ExternalLink to={ `https://github.com/${user}` }>
                      <div className='image'>
                        <img
                          src={ Object.keys(members).includes(user) ? members[user].avatar : `https://github.com/${user}.png?v=${Math.random()}` }
                          alt='User Avatar'
                          height='150'
                          width='150'
                        />
                      </div>
                      <div className='details'>
                        <h4>{ user }</h4>
                        <p><strong>{ this.state.contributors[user] }</strong> Contributions</p>
                      </div>
                    </ExternalLink>
                  </div>
                );
              })
            :
              <Loader />
          }
        </div>
      </div>
    );
  }
}

export default ContributorsPage;
